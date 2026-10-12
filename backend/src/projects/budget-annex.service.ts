import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { BUDGET_PLAN_FIELDS } from '../common/enums/project.enums';
import { ProjectAccessService } from './project-access.service';
import { BudgetService } from './budget.service';
import {
  BudgetCommentDto,
  BudgetDescriptionDto,
  BudgetReasonDto,
} from './dto/budget.dto';

type Db = Prisma.TransactionClient;
type VersionRow = Prisma.BudgetVersionGetPayload<object>;

@Injectable()
export class BudgetAnnexService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly budget: BudgetService,
  ) {}

  async create(projectId: string, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      await this.access.assertCanRead(actor, projectId, tx);
      await this.access.assertCanEditBudget(actor, projectId, tx);
      await this.access.assertNotArchived(projectId, tx);

      const open = await this.budget.openVersion(projectId, tx);
      if (open) {
        throw new ConflictException(
          `${open.name} jest już otwarty. Dokończ go albo odrzuć`,
        );
      }
      const latest = await this.latestApproved(projectId, tx);
      const current = await this.budget.currentVersion(projectId, tx);
      if (!latest || !current) {
        throw new ConflictException('Najpierw zatwierdź wersję podstawową');
      }

      const number = latest.number + 1;
      const version = await tx.budgetVersion.create({
        data: {
          projectId,
          number,
          name: `Aneks ${number}`,
          status: 'DRAFT',
          createdById: actor.id,
        },
      });

      const [categories, positions] = await Promise.all([
        tx.budgetCategory.findMany({ where: { versionId: current.id } }),
        tx.budgetPosition.findMany({ where: { versionId: current.id } }),
      ]);
      if (categories.length > 0) {
        await tx.budgetCategory.createMany({
          data: categories.map((category) => ({
            versionId: version.id,
            key: category.key,
            name: category.name,
            partnerId: category.partnerId,
            sortOrder: category.sortOrder,
          })),
        });
      }
      if (positions.length > 0) {
        await tx.budgetPosition.createMany({
          data: positions.map((position) => ({
            versionId: version.id,
            categoryKey: position.categoryKey,
            key: position.key,
            name: position.name,
            sortOrder: position.sortOrder,
            planned: position.planned,
            grant: position.grant,
            ownContribution: position.ownContribution,
            partnerId: position.partnerId,
          })),
        });
      }

      await this.log(version, 'CREATED', actor, tx);
      return { id: version.id, number: version.number, name: version.name };
    }, SERIALIZABLE);
  }

  async submit(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateForEditor(id, actor, tx);
      if (version.status !== 'DRAFT') {
        throw new ConflictException(
          'Do akceptacji można wysłać tylko wersję roboczą',
        );
      }
      await this.assertHasChanges(version, tx);

      await tx.budgetVersion.update({
        where: { id },
        data: {
          status: 'PENDING',
          submittedById: actor.id,
          submittedAt: new Date(),
        },
      });
      await this.log(version, 'SUBMITTED', actor, tx);
    }, SERIALIZABLE);
  }

  async withdraw(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateForEditor(id, actor, tx);
      if (version.status !== 'PENDING') {
        throw new ConflictException('Ta wersja nie czeka na akceptację');
      }

      await tx.budgetVersion.update({
        where: { id },
        data: { status: 'DRAFT' },
      });
      await this.log(version, 'WITHDRAWN', actor, tx);
    }, SERIALIZABLE);
  }

  async approve(
    id: string,
    dto: BudgetDescriptionDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateForApprover(id, actor, tx);
      const ownDraft =
        version.status === 'DRAFT' && version.createdById === actor.id;
      if (version.status !== 'PENDING' && !ownDraft) {
        throw new ConflictException(
          'Zatwierdzić można wersję wysłaną do akceptacji albo własną wersję roboczą',
        );
      }
      await this.assertHasChanges(version, tx);
      const current = await this.budget.currentVersion(version.projectId, tx);
      if (current && current.id !== version.id) {
        await this.budget.assertNoOrphanedSpending(
          version.projectId,
          (await this.plan(current.id, tx)).positions,
          version.id,
          tx,
        );
      }

      await tx.budgetVersion.updateMany({
        where: { projectId: version.projectId, id: { not: id } },
        data: { isCurrent: false },
      });
      await tx.budgetVersion.update({
        where: { id },
        data: {
          status: 'APPROVED',
          isCurrent: true,
          approvedById: actor.id,
          approvedAt: new Date(),
          description: dto.description,
        },
      });
      await this.log(version, 'APPROVED', actor, tx, dto.description);
    }, SERIALIZABLE);
  }

  async reject(
    id: string,
    dto: BudgetCommentDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateForApprover(id, actor, tx);
      if (version.status !== 'PENDING') {
        throw new ConflictException('Ta wersja nie czeka na akceptację');
      }

      await tx.budgetVersion.update({
        where: { id },
        data: { status: 'DRAFT' },
      });
      await this.log(version, 'REJECTED', actor, tx, dto.comment);
    }, SERIALIZABLE);
  }

  async revert(
    id: string,
    dto: BudgetReasonDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateForApprover(id, actor, tx);
      const latest = await this.latestApproved(version.projectId, tx);
      if (version.number === 0 || latest?.id !== version.id) {
        throw new ConflictException(
          'Cofnąć można tylko ostatni zatwierdzony aneks',
        );
      }
      if (await this.budget.openVersion(version.projectId, tx)) {
        throw new ConflictException(
          'Najpierw dokończ albo odrzuć otwarty aneks',
        );
      }
      const restored = await tx.budgetVersion.findFirst({
        where: {
          projectId: version.projectId,
          status: 'APPROVED',
          number: { lt: version.number },
        },
        orderBy: { number: 'desc' },
      });
      if (!restored) {
        throw new ConflictException('Brak wcześniejszej zatwierdzonej wersji');
      }
      await this.budget.assertNoOrphanedSpending(
        version.projectId,
        (await this.plan(version.id, tx)).positions,
        restored.id,
        tx,
      );

      await tx.budgetVersion.update({
        where: { id },
        data: {
          status: 'DRAFT',
          isCurrent: false,
          approvedById: null,
          approvedAt: null,
        },
      });
      await tx.budgetVersion.update({
        where: { id: restored.id },
        data: { isCurrent: true },
      });
      await this.log(version, 'REVERTED', actor, tx, dto.reason);
    }, SERIALIZABLE);
  }

  async discard(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateForEditor(id, actor, tx);
      if (version.status !== 'DRAFT') {
        throw new ConflictException('Usunąć można tylko wersję roboczą');
      }
      const current = await this.budget.currentVersion(version.projectId, tx);
      await this.budget.assertNoOrphanedSpending(
        version.projectId,
        (await this.plan(id, tx)).positions,
        current?.id ?? null,
        tx,
      );

      await tx.budgetPosition.deleteMany({ where: { versionId: id } });
      await tx.budgetCategory.deleteMany({ where: { versionId: id } });
      await tx.budgetVersion.delete({ where: { id } });
      await this.budget.log(tx, {
        projectId: version.projectId,
        versionId: null,
        versionName: version.name,
        kind: 'DISCARDED',
        actorId: actor.id,
      });
    }, SERIALIZABLE);
  }

  async editMetadata(
    id: string,
    dto: BudgetDescriptionDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const version = await this.locateForApprover(id, actor, tx);
      if (version.status !== 'APPROVED') {
        throw new ConflictException(
          'Opis zmienia się tylko w zatwierdzonej wersji',
        );
      }

      await tx.budgetVersion.update({
        where: { id },
        data: { description: dto.description },
      });
      await this.log(version, 'METADATA_EDITED', actor, tx, dto.description);
    }, SERIALIZABLE);
  }

  private async locateForEditor(
    id: string,
    actor: AuthenticatedUser,
    db: Db,
  ): Promise<VersionRow> {
    const version = await this.budget.locateVersion(id, db);
    await this.access.assertCanRead(actor, version.projectId, db);
    await this.access.assertCanUseModule(
      actor,
      version.projectId,
      'BUDGET',
      db,
    );
    await this.access.assertCanEditBudget(actor, version.projectId, db);
    await this.access.assertNotArchived(version.projectId, db);
    return version;
  }

  private async locateForApprover(
    id: string,
    actor: AuthenticatedUser,
    db: Db,
  ): Promise<VersionRow> {
    const version = await this.budget.locateVersion(id, db);
    this.access.assertCanApproveBudget(actor);
    await this.access.assertNotArchived(version.projectId, db);
    return version;
  }

  private async latestApproved(projectId: string, db: Db) {
    return db.budgetVersion.findFirst({
      where: { projectId, status: 'APPROVED' },
      orderBy: { number: 'desc' },
    });
  }

  private async plan(versionId: string, db: Db) {
    const [categories, positions] = await Promise.all([
      db.budgetCategory.findMany({ where: { versionId } }),
      db.budgetPosition.findMany({ where: { versionId } }),
    ]);
    return { categories, positions };
  }

  private async assertHasChanges(version: VersionRow, db: Db): Promise<void> {
    const current = await this.budget.currentVersion(version.projectId, db);
    const next = await this.plan(version.id, db);

    if (!current || current.id === version.id) {
      if (next.positions.length === 0) {
        throw new ConflictException(
          'Dodaj do budżetu co najmniej jedną pozycję',
        );
      }
      return;
    }

    const previous = await this.plan(current.id, db);
    const previousCategories = new Map(
      previous.categories.map((c) => [c.key, c]),
    );
    const nextCategories = new Set(next.categories.map((c) => c.key));
    const previousPositions = new Map(
      previous.positions.map((p) => [p.key, p]),
    );
    const nextPositions = new Set(next.positions.map((p) => p.key));

    const changed =
      next.categories.some((category) => {
        const before = previousCategories.get(category.key);
        return (
          !before ||
          before.name !== category.name ||
          before.partnerId !== category.partnerId
        );
      }) ||
      previous.categories.some((c) => !nextCategories.has(c.key)) ||
      previous.positions.some((p) => !nextPositions.has(p.key)) ||
      next.positions.some((position) => {
        const before = previousPositions.get(position.key);
        return (
          !before ||
          before.name !== position.name ||
          before.partnerId !== position.partnerId ||
          BUDGET_PLAN_FIELDS.some(
            (field) => !before[field].equals(position[field]),
          )
        );
      });

    if (!changed) {
      throw new ConflictException('Brak zmian względem obowiązującej wersji');
    }
  }

  private async log(
    version: VersionRow,
    kind:
      | 'CREATED'
      | 'SUBMITTED'
      | 'WITHDRAWN'
      | 'APPROVED'
      | 'REJECTED'
      | 'REVERTED'
      | 'METADATA_EDITED',
    actor: AuthenticatedUser,
    db: Db,
    comment: string | null = null,
  ): Promise<void> {
    await this.budget.log(db, {
      projectId: version.projectId,
      versionId: version.id,
      versionName: version.name,
      kind,
      actorId: actor.id,
      comment,
    });
  }
}
