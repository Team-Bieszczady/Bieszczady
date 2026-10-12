import { randomUUID } from 'crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  BUDGET_DEFAULT_COLUMNS,
  type BudgetHistoryKind,
} from '../common/enums/project.enums';
import { ProjectAccessService } from './project-access.service';
import { PERSON_SELECT } from './prisma-selects';
import {
  CreateBudgetCategoryDto,
  CreateBudgetColumnDto,
  CreateBudgetPositionDto,
  DocumentLinkDto,
  GrantBudgetAccessDto,
  RenameBudgetColumnDto,
  UpdateBudgetCategoryDto,
  UpdateBudgetCategorySettingsDto,
  UpdateBudgetPositionDto,
} from './dto/budget.dto';

type Db = Prisma.TransactionClient;

const EDIT_MERGE_WINDOW_MS = 30 * 60 * 1000;

const VERSION_INCLUDE = {
  createdBy: PERSON_SELECT,
  submittedBy: PERSON_SELECT,
  approvedBy: PERSON_SELECT,
  categories: { orderBy: { sortOrder: 'asc' } },
  positions: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.BudgetVersionInclude;

const ACTUAL_INCLUDE = {
  values: true,
  invoices: {
    include: { enteredBy: PERSON_SELECT },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  },
} satisfies Prisma.BudgetActualInclude;

type Person = { id: string; firstName: string; lastName: string };
type VersionRow = Prisma.BudgetVersionGetPayload<{
  include: typeof VERSION_INCLUDE;
}>;
type ActualRow = Prisma.BudgetActualGetPayload<{
  include: typeof ACTUAL_INCLUDE;
}>;
type CategoryRow = Prisma.BudgetCategoryGetPayload<object>;
type PositionRow = Prisma.BudgetPositionGetPayload<object>;
type LinkColumns = {
  documentFolderId: string | null;
  documentId: string | null;
};

export type DocumentLink =
  | { kind: 'FOLDER'; folderId: string }
  | { kind: 'FILE'; folderId: string; documentId: string; name: string };

export interface PartnerScope {
  partnerId: string | null;
}

@Injectable()
export class BudgetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async getStore(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);
    await this.ensureInitialised(projectId, viewer);

    const [canEdit, canManageAccess, scope] = await Promise.all([
      this.access.canEditBudget(viewer, projectId),
      this.access.canManageTasks(viewer, projectId),
      this.partnerScope(viewer, projectId),
    ]);
    const restrictTo = scope && !canEdit ? scope.partnerId : undefined;

    const [versions, columns, actuals, settings, history, partners] =
      await Promise.all([
        this.prisma.budgetVersion.findMany({
          where: { projectId },
          include: VERSION_INCLUDE,
          orderBy: { number: 'asc' },
        }),
        this.prisma.budgetColumn.findMany({
          where: { projectId },
          orderBy: { sortOrder: 'asc' },
        }),
        this.prisma.budgetActual.findMany({
          where: { projectId },
          include: ACTUAL_INCLUDE,
        }),
        this.prisma.budgetCategorySettings.findMany({ where: { projectId } }),
        this.prisma.budgetHistoryEntry.findMany({
          where: { projectId },
          include: { actor: PERSON_SELECT },
          orderBy: { at: 'asc' },
        }),
        this.partnersFor(projectId, this.prisma),
      ]);

    const settingsByKey = new Map(
      settings.map((row) => [row.categoryKey, row]),
    );
    const visibleCategory = (category: CategoryRow) =>
      restrictTo === undefined ||
      (restrictTo !== null &&
        category.partnerId === restrictTo &&
        settingsByKey.get(category.key)?.visibleToPartner === true);

    const visiblePositionKeys = new Set<string>();
    const visibleCategoryKeys = new Set<string>();
    for (const version of versions) {
      for (const category of version.categories.filter(visibleCategory)) {
        visibleCategoryKeys.add(category.key);
        for (const position of version.positions) {
          if (position.categoryKey === category.key) {
            visiblePositionKeys.add(position.key);
          }
        }
      }
    }

    const links = await this.resolveLinks(projectId, [
      ...actuals,
      ...actuals.flatMap((actual) => actual.invoices),
      ...settings,
    ]);

    return {
      columns: columns.map((column) => ({
        id: column.key,
        name: column.name,
        type: column.type,
        locked: column.locked,
      })),
      versions: versions.map((version) =>
        this.toVersion(version, history, visibleCategory),
      ),
      actuals: Object.fromEntries(
        actuals
          .filter((actual) => visiblePositionKeys.has(actual.positionKey))
          .map((actual) => [actual.positionKey, this.toActuals(actual, links)]),
      ),
      categorySettings: Object.fromEntries(
        settings
          .filter((row) => visibleCategoryKeys.has(row.categoryKey))
          .map((row) => [
            row.categoryKey,
            {
              detailed: row.detailed,
              partnerCanEdit: row.partnerCanEdit,
              visibleToPartner: row.visibleToPartner,
              document: links(row),
            },
          ]),
      ),
      history: history
        .filter(
          (entry) => restrictTo === undefined || entry.actorId === viewer.id,
        )
        .map((entry) => ({
          id: entry.id,
          at: entry.at.toISOString(),
          by: this.toActor(entry.actor),
          versionId: entry.versionId,
          versionName: entry.versionName,
          kind: entry.kind,
          comment: entry.comment,
        })),
      permissions: {
        canEdit,
        canApprove: viewer.isDirector,
        canManageAccess,
        partnerId: scope?.partnerId ?? null,
      },
      partners:
        restrictTo === undefined
          ? partners
          : partners.filter((partner) => partner.id === restrictTo),
    };
  }

  async listPartners(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);
    return this.partnersFor(projectId, this.prisma);
  }

  async createCategory(
    versionId: string,
    dto: CreateBudgetCategoryDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const version = await this.locateEditableVersion(versionId, actor, tx);
      if (dto.partnerId) {
        await this.assertPartnerUsable(version.projectId, dto.partnerId, tx);
      }

      const last = await tx.budgetCategory.aggregate({
        where: { versionId },
        _max: { sortOrder: true },
      });
      const category = await tx.budgetCategory.create({
        data: {
          versionId,
          key: randomUUID(),
          name: dto.name,
          partnerId: dto.partnerId ?? null,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });
      await this.touchPlan(version, actor, tx);

      return this.toCategory(category, []);
    }, SERIALIZABLE);
  }

  async updateCategory(
    versionId: string,
    key: string,
    dto: UpdateBudgetCategoryDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const version = await this.locateEditableVersion(versionId, actor, tx);
      const category = await this.locateCategory(versionId, key, tx);

      const data: Prisma.BudgetCategoryUpdateInput = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.partnerId !== undefined && dto.partnerId !== category.partnerId) {
        if (dto.partnerId) {
          await this.assertPartnerUsable(version.projectId, dto.partnerId, tx);
        }
        data.partner = dto.partnerId
          ? { connect: { id: dto.partnerId } }
          : { disconnect: true };
      }

      const updated = await tx.budgetCategory.update({
        where: { id: category.id },
        data,
      });
      await this.touchPlan(version, actor, tx);

      const positions = await tx.budgetPosition.findMany({
        where: { versionId, categoryKey: key },
        orderBy: { sortOrder: 'asc' },
      });
      return this.toCategory(updated, positions);
    }, SERIALIZABLE);
  }

  async deleteCategory(
    versionId: string,
    key: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateEditableVersion(versionId, actor, tx);
      const category = await this.locateCategory(versionId, key, tx);

      await tx.budgetPosition.deleteMany({
        where: { versionId, categoryKey: key },
      });
      await tx.budgetCategory.delete({ where: { id: category.id } });
      await this.touchPlan(version, actor, tx);
    }, SERIALIZABLE);
  }

  async createPosition(
    versionId: string,
    categoryKey: string,
    dto: CreateBudgetPositionDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const version = await this.locateEditableVersion(versionId, actor, tx);
      await this.locateCategory(versionId, categoryKey, tx);

      const last = await tx.budgetPosition.aggregate({
        where: { versionId, categoryKey },
        _max: { sortOrder: true },
      });
      const position = await tx.budgetPosition.create({
        data: {
          versionId,
          categoryKey,
          key: randomUUID(),
          name: dto.name ?? 'Nowa pozycja',
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });
      await this.touchPlan(version, actor, tx);

      return this.toPosition(position);
    }, SERIALIZABLE);
  }

  async updatePosition(
    versionId: string,
    key: string,
    dto: UpdateBudgetPositionDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const version = await this.locateEditableVersion(versionId, actor, tx);
      const position = await this.locatePosition(versionId, key, tx);

      const data: Prisma.BudgetPositionUpdateInput = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.planned !== undefined) data.planned = dto.planned;
      if (dto.grant !== undefined) data.grant = dto.grant;
      if (dto.ownContribution !== undefined) {
        data.ownContribution = dto.ownContribution;
      }

      const updated = await tx.budgetPosition.update({
        where: { id: position.id },
        data,
      });
      await this.touchPlan(version, actor, tx);

      return this.toPosition(updated);
    }, SERIALIZABLE);
  }

  async deletePosition(
    versionId: string,
    key: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateEditableVersion(versionId, actor, tx);
      const position = await this.locatePosition(versionId, key, tx);

      await tx.budgetPosition.delete({ where: { id: position.id } });
      await this.touchPlan(version, actor, tx);
    }, SERIALIZABLE);
  }

  async createColumn(
    projectId: string,
    dto: CreateBudgetColumnDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.access.assertCanRead(actor, projectId, tx);
      await this.access.assertCanEditBudget(actor, projectId, tx);
      await this.access.assertNotArchived(projectId, tx);

      const last = await tx.budgetColumn.aggregate({
        where: { projectId },
        _max: { sortOrder: true },
      });
      const column = await tx.budgetColumn.create({
        data: {
          projectId,
          key: randomUUID(),
          name: dto.name,
          type: dto.type,
          locked: false,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });

      return {
        id: column.key,
        name: column.name,
        type: column.type,
        locked: column.locked,
      };
    }, SERIALIZABLE);
  }

  async renameColumn(
    projectId: string,
    key: string,
    dto: RenameBudgetColumnDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const column = await this.locateUnlockedColumn(projectId, key, actor, tx);

      const updated = await tx.budgetColumn.update({
        where: { id: column.id },
        data: { name: dto.name },
      });
      return {
        id: updated.key,
        name: updated.name,
        type: updated.type,
        locked: updated.locked,
      };
    }, SERIALIZABLE);
  }

  async deleteColumn(
    projectId: string,
    key: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const column = await this.locateUnlockedColumn(projectId, key, actor, tx);

      await tx.budgetActualValue.deleteMany({
        where: { columnKey: key, actual: { projectId } },
      });
      await tx.budgetColumn.delete({ where: { id: column.id } });
    }, SERIALIZABLE);
  }

  async updateCategorySettings(
    projectId: string,
    categoryKey: string,
    dto: UpdateBudgetCategorySettingsDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.access.assertCanRead(actor, projectId, tx);
      await this.access.assertCanEditBudget(actor, projectId, tx);
      await this.access.assertNotArchived(projectId, tx);

      const exists = await tx.budgetCategory.count({
        where: { key: categoryKey, version: { projectId } },
      });
      if (exists === 0) {
        throw new NotFoundException('Nie znaleziono kategorii budżetu');
      }

      const data: Prisma.BudgetCategorySettingsUncheckedUpdateInput = {};
      if (dto.detailed !== undefined) data.detailed = dto.detailed;
      if (dto.partnerCanEdit !== undefined) {
        data.partnerCanEdit = dto.partnerCanEdit;
      }
      if (dto.visibleToPartner !== undefined) {
        data.visibleToPartner = dto.visibleToPartner;
      }
      if (dto.document !== undefined) {
        Object.assign(
          data,
          await this.linkColumns(projectId, dto.document, tx),
        );
      }

      const row = await tx.budgetCategorySettings.upsert({
        where: { projectId_categoryKey: { projectId, categoryKey } },
        update: data,
        create: {
          projectId,
          categoryKey,
          ...(data as Omit<
            Prisma.BudgetCategorySettingsUncheckedCreateInput,
            'projectId' | 'categoryKey'
          >),
        },
      });

      return {
        detailed: row.detailed,
        partnerCanEdit: row.partnerCanEdit,
        visibleToPartner: row.visibleToPartner,
      };
    }, SERIALIZABLE);
  }

  async listAccess(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);

    return this.prisma.budgetAccess.findMany({
      where: { projectId },
      include: { user: PERSON_SELECT, grantedBy: PERSON_SELECT },
      orderBy: { createdAt: 'asc' },
    });
  }

  async grantAccess(
    projectId: string,
    dto: GrantBudgetAccessDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.access.assertCanRead(actor, projectId, tx);
      await this.access.assertCanManageBudgetAccess(actor, projectId, tx);
      await this.access.assertNotArchived(projectId, tx);

      const member = await tx.projectMember.count({
        where: { projectId, userId: dto.userId },
      });
      if (member === 0) {
        throw new ConflictException(
          'Dostęp do budżetu można nadać tylko członkowi projektu',
        );
      }
      const already = await tx.budgetAccess.count({
        where: { projectId, userId: dto.userId },
      });
      if (already > 0) {
        throw new ConflictException('Ta osoba ma już dostęp do budżetu');
      }

      return tx.budgetAccess.create({
        data: { projectId, userId: dto.userId, grantedById: actor.id },
        include: { user: PERSON_SELECT, grantedBy: PERSON_SELECT },
      });
    }, SERIALIZABLE);
  }

  async revokeAccess(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const grant = await tx.budgetAccess.findUnique({ where: { id } });
      if (!grant) throw new NotFoundException('Nie znaleziono dostępu');
      await this.access.assertCanRead(actor, grant.projectId, tx);
      await this.access.assertCanManageBudgetAccess(actor, grant.projectId, tx);
      await this.access.assertNotArchived(grant.projectId, tx);

      await tx.budgetAccess.delete({ where: { id } });
    }, SERIALIZABLE);
  }

  async partnerScope(
    actor: AuthenticatedUser,
    projectId: string,
    db: Db = this.prisma,
  ): Promise<PartnerScope | null> {
    if (actor.isDirector) return null;

    const member = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: actor.id } },
      select: { projectRole: true, partnerId: true },
    });
    return member?.projectRole === 'PARTNER'
      ? { partnerId: member.partnerId }
      : null;
  }

  async locateVersion(versionId: string, db: Db) {
    const version = await db.budgetVersion.findUnique({
      where: { id: versionId },
    });
    if (!version) throw new NotFoundException('Nie znaleziono wersji budżetu');
    return version;
  }

  async currentVersion(projectId: string, db: Db) {
    return db.budgetVersion.findFirst({
      where: { projectId, isCurrent: true },
    });
  }

  async openVersion(projectId: string, db: Db) {
    return db.budgetVersion.findFirst({
      where: { projectId, status: { in: ['DRAFT', 'PENDING'] } },
    });
  }

  async log(
    db: Db,
    entry: {
      projectId: string;
      versionId: string | null;
      versionName: string;
      kind: BudgetHistoryKind;
      actorId: string;
      comment?: string | null;
    },
  ): Promise<void> {
    const now = new Date();

    if (entry.kind === 'EDITED') {
      const last = await db.budgetHistoryEntry.findFirst({
        where: { projectId: entry.projectId },
        orderBy: { at: 'desc' },
      });
      if (
        last?.kind === 'EDITED' &&
        last.versionId === entry.versionId &&
        last.actorId === entry.actorId &&
        now.getTime() - last.at.getTime() < EDIT_MERGE_WINDOW_MS
      ) {
        await db.budgetHistoryEntry.update({
          where: { id: last.id },
          data: { at: now },
        });
        return;
      }
    }

    await db.budgetHistoryEntry.create({
      data: {
        projectId: entry.projectId,
        versionId: entry.versionId,
        versionName: entry.versionName,
        kind: entry.kind,
        actorId: entry.actorId,
        comment: entry.comment ?? null,
        at: now,
      },
    });
  }

  async linkColumns(
    projectId: string,
    link: DocumentLinkDto | null,
    db: Db,
  ): Promise<LinkColumns> {
    if (!link) return { documentFolderId: null, documentId: null };

    const folder = await db.folder.count({
      where: { id: link.folderId, projectId, deletedAt: null },
    });
    if (folder === 0) {
      throw new ConflictException('Nie znaleziono folderu w tym projekcie');
    }
    if (link.kind === 'FOLDER') {
      return { documentFolderId: link.folderId, documentId: null };
    }

    const document = await db.document.count({
      where: {
        id: link.documentId,
        folderId: link.folderId,
        projectId,
        deletedAt: null,
      },
    });
    if (document === 0) {
      throw new ConflictException('Nie znaleziono dokumentu w tym folderze');
    }
    return { documentFolderId: link.folderId, documentId: link.documentId! };
  }

  async resolveLinks(projectId: string, rows: LinkColumns[]) {
    const folderIds = [
      ...new Set(rows.flatMap((row) => row.documentFolderId ?? [])),
    ];
    const documentIds = [
      ...new Set(rows.flatMap((row) => row.documentId ?? [])),
    ];

    const [folders, documents] = await Promise.all([
      folderIds.length === 0
        ? []
        : this.prisma.folder.findMany({
            where: { id: { in: folderIds }, projectId, deletedAt: null },
            select: { id: true },
          }),
      documentIds.length === 0
        ? []
        : this.prisma.document.findMany({
            where: { id: { in: documentIds }, projectId, deletedAt: null },
            select: { id: true, name: true, folderId: true },
          }),
    ]);
    const liveFolders = new Set(folders.map((folder) => folder.id));
    const liveDocuments = new Map(documents.map((doc) => [doc.id, doc]));

    return (row: LinkColumns): DocumentLink | null => {
      if (!row.documentFolderId || !liveFolders.has(row.documentFolderId)) {
        return null;
      }
      if (!row.documentId) {
        return { kind: 'FOLDER', folderId: row.documentFolderId };
      }
      const document = liveDocuments.get(row.documentId);
      if (!document || document.folderId !== row.documentFolderId) return null;
      return {
        kind: 'FILE',
        folderId: row.documentFolderId,
        documentId: document.id,
        name: document.name,
      };
    };
  }

  toActor(person: Person | null) {
    return person
      ? { id: person.id, name: `${person.firstName} ${person.lastName}` }
      : null;
  }

  toPosition(position: PositionRow) {
    return {
      id: position.key,
      name: position.name,
      planned: position.planned.toFixed(2),
      grant: position.grant.toFixed(2),
      ownContribution: position.ownContribution.toFixed(2),
    };
  }

  toCategory(category: CategoryRow, positions: PositionRow[]) {
    return {
      id: category.key,
      name: category.name,
      partnerId: category.partnerId,
      positions: positions
        .filter((position) => position.categoryKey === category.key)
        .map((position) => this.toPosition(position)),
    };
  }

  private toVersion(
    version: VersionRow,
    history: {
      versionId: string | null;
      kind: string;
      at: Date;
      comment: string | null;
      actor: Person;
    }[],
    visibleCategory: (category: CategoryRow) => boolean,
  ) {
    return {
      id: version.id,
      number: version.number,
      name: version.name,
      status: version.status,
      isCurrent: version.isCurrent,
      createdBy: this.toActor(version.createdBy),
      createdAt: version.createdAt.toISOString(),
      submittedBy: this.toActor(version.submittedBy),
      submittedAt: version.submittedAt?.toISOString() ?? null,
      approvedBy: this.toActor(version.approvedBy),
      approvedAt: version.approvedAt?.toISOString() ?? null,
      description: version.description,
      savedAt: version.savedAt?.toISOString() ?? null,
      rejections: history
        .filter(
          (entry) =>
            entry.versionId === version.id && entry.kind === 'REJECTED',
        )
        .map((entry) => ({
          by: this.toActor(entry.actor),
          at: entry.at.toISOString(),
          comment: entry.comment ?? '',
        })),
      categories: version.categories
        .filter(visibleCategory)
        .map((category) => this.toCategory(category, version.positions)),
    };
  }

  private toActuals(
    actual: ActualRow,
    links: (row: LinkColumns) => DocumentLink | null,
  ) {
    return {
      values: Object.fromEntries(
        actual.values.map((value) => [value.columnKey, value.value]),
      ),
      invoices: actual.invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount.toFixed(2),
        contractor: invoice.contractor,
        date: invoice.date.toISOString().slice(0, 10),
        grant: invoice.grant.toFixed(2),
        ownContribution: invoice.ownContribution.toFixed(2),
        enteredBy: `${invoice.enteredBy.firstName} ${invoice.enteredBy.lastName}`,
        status: invoice.status,
        document: links(invoice),
      })),
      status: actual.status,
      document: links(actual),
    };
  }

  private async ensureInitialised(
    projectId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const existing = await this.prisma.budgetVersion.count({
      where: { projectId },
    });
    if (existing > 0) return;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { archivedAt: true },
    });
    if (project?.archivedAt) return;

    await this.prisma.$transaction(async (tx) => {
      const again = await tx.budgetVersion.count({ where: { projectId } });
      if (again > 0) return;

      const version = await tx.budgetVersion.create({
        data: {
          projectId,
          number: 0,
          name: 'Wersja podstawowa',
          status: 'DRAFT',
          createdById: actor.id,
        },
      });
      const columns = await tx.budgetColumn.count({ where: { projectId } });
      if (columns === 0) {
        await tx.budgetColumn.createMany({
          data: BUDGET_DEFAULT_COLUMNS.map((column, index) => ({
            projectId,
            ...column,
            sortOrder: index + 1,
          })),
        });
      }
      await this.log(tx, {
        projectId,
        versionId: version.id,
        versionName: version.name,
        kind: 'CREATED',
        actorId: actor.id,
      });
    }, SERIALIZABLE);
  }

  private async partnersFor(projectId: string, db: Db) {
    return db.partner.findMany({
      where: {
        OR: [
          { status: 'ACTIVE', projects: { some: { projectId } } },
          { budgetCategories: { some: { version: { projectId } } } },
        ],
      },
      select: { id: true, name: true, status: true },
      orderBy: { name: 'asc' },
    });
  }

  private async locateEditableVersion(
    versionId: string,
    actor: AuthenticatedUser,
    db: Db,
  ) {
    const version = await this.locateVersion(versionId, db);
    await this.access.assertCanRead(actor, version.projectId, db);
    await this.access.assertCanUseModule(
      actor,
      version.projectId,
      'BUDGET',
      db,
    );
    await this.access.assertCanEditBudget(actor, version.projectId, db);
    await this.access.assertNotArchived(version.projectId, db);
    if (version.status === 'APPROVED') {
      throw new ConflictException(
        'Zatwierdzona wersja jest tylko do odczytu. Zmiany wprowadza się kolejnym aneksem',
      );
    }
    return version;
  }

  private async locateCategory(versionId: string, key: string, db: Db) {
    const category = await db.budgetCategory.findUnique({
      where: { versionId_key: { versionId, key } },
    });
    if (!category) throw new NotFoundException('Nie znaleziono kategorii');
    return category;
  }

  private async locatePosition(versionId: string, key: string, db: Db) {
    const position = await db.budgetPosition.findUnique({
      where: { versionId_key: { versionId, key } },
    });
    if (!position) throw new NotFoundException('Nie znaleziono pozycji');
    return position;
  }

  private async locateUnlockedColumn(
    projectId: string,
    key: string,
    actor: AuthenticatedUser,
    db: Db,
  ) {
    await this.access.assertCanRead(actor, projectId, db);
    await this.access.assertCanEditBudget(actor, projectId, db);
    await this.access.assertNotArchived(projectId, db);

    const column = await db.budgetColumn.findUnique({
      where: { projectId_key: { projectId, key } },
    });
    if (!column) throw new NotFoundException('Nie znaleziono kolumny');
    if (column.locked) {
      throw new ConflictException('Tej kolumny nie można zmienić ani usunąć');
    }
    return column;
  }

  private async assertPartnerUsable(
    projectId: string,
    partnerId: string,
    db: Db,
  ): Promise<void> {
    const partner = await db.partner.findFirst({
      where: { id: partnerId, projects: { some: { projectId } } },
      select: { status: true },
    });
    if (!partner) {
      throw new ConflictException(
        'Ten partner nie jest przypisany do projektu',
      );
    }
    if (partner.status !== 'ACTIVE') {
      throw new ConflictException('Ten partner jest zatrzymany');
    }
  }

  private async touchPlan(
    version: { id: string; projectId: string; name: string },
    actor: AuthenticatedUser,
    db: Db,
  ): Promise<void> {
    await db.budgetVersion.update({
      where: { id: version.id },
      data: { savedAt: new Date() },
    });
    await this.log(db, {
      projectId: version.projectId,
      versionId: version.id,
      versionName: version.name,
      kind: 'EDITED',
      actorId: actor.id,
    });
  }
}
