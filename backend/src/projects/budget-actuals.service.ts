import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  BUDGET_PLAN_FIELDS,
  BUDGET_SPENT_COLUMN,
} from '../common/enums/project.enums';
import { ProjectAccessService } from './project-access.service';
import { BudgetService } from './budget.service';
import {
  CreateBudgetInvoiceDto,
  MONEY_PATTERN,
  MoveBudgetActualsDto,
  UpdateBudgetActualDto,
  UpdateBudgetCellDto,
  UpdateBudgetInvoiceStatusDto,
} from './dto/budget.dto';

type Db = Prisma.TransactionClient;

interface PositionContext {
  projectId: string;
  positionKey: string;
  categoryKey: string;
  partnerId: string | null;
  detailed: boolean;
  partnerCanEdit: boolean;
  visibleToPartner: boolean;
}

const ZERO = new Prisma.Decimal(0);

@Injectable()
export class BudgetActualsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly budget: BudgetService,
  ) {}

  async updateCell(
    projectId: string,
    positionKey: string,
    columnKey: string,
    dto: UpdateBudgetCellDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const position = await this.locateWritable(
        projectId,
        positionKey,
        actor,
        tx,
      );

      const column = await tx.budgetColumn.findUnique({
        where: { projectId_key: { projectId, key: columnKey } },
      });
      if (!column) throw new NotFoundException('Nie znaleziono kolumny');
      if ((BUDGET_PLAN_FIELDS as readonly string[]).includes(columnKey)) {
        throw new ConflictException('Tę kwotę zmienia się w planie budżetu');
      }
      if (
        columnKey === BUDGET_SPENT_COLUMN &&
        !this.isSummary(position) &&
        !(await this.access.canEditBudget(actor, projectId, tx))
      ) {
        throw new ConflictException(
          'Poniesione liczy się z faktur. Ręcznie wpisuje się je tylko w trybie podsumowania',
        );
      }

      let value = dto.value;
      if (column.type === 'money' && value !== '') {
        const normalised = value.replace(/\s/g, '').replace(',', '.');
        if (!MONEY_PATTERN.test(normalised)) {
          throw new ConflictException('Wpisz kwotę, np. 1500 lub 1500,50');
        }
        value = new Prisma.Decimal(normalised).toFixed(2);
      }

      const actual = await this.ensureActual(projectId, positionKey, tx);
      if (value === '') {
        await tx.budgetActualValue.deleteMany({
          where: { actualId: actual.id, columnKey },
        });
        return;
      }
      await tx.budgetActualValue.upsert({
        where: { actualId_columnKey: { actualId: actual.id, columnKey } },
        update: { value },
        create: { actualId: actual.id, columnKey, value },
      });
    }, SERIALIZABLE);
  }

  async updateActual(
    projectId: string,
    positionKey: string,
    dto: UpdateBudgetActualDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const position = await this.locateWritable(
        projectId,
        positionKey,
        actor,
        tx,
      );

      const data: Prisma.BudgetActualUncheckedUpdateInput = {};
      if (dto.status !== undefined) {
        if (!this.isSummary(position)) {
          throw new ConflictException(
            'W tabeli szczegółowej status wynika z faktur',
          );
        }
        data.status = dto.status;
      }
      if (dto.document !== undefined) {
        Object.assign(
          data,
          await this.budget.linkColumns(projectId, dto.document, tx),
        );
      }

      const actual = await this.ensureActual(projectId, positionKey, tx);
      await tx.budgetActual.update({ where: { id: actual.id }, data });
    }, SERIALIZABLE);
  }

  async addInvoice(
    projectId: string,
    positionKey: string,
    dto: CreateBudgetInvoiceDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const position = await this.locateWritable(
        projectId,
        positionKey,
        actor,
        tx,
      );
      if (this.isSummary(position)) {
        throw new ConflictException(
          'Faktury dodaje się tylko w tabeli szczegółowej',
        );
      }

      const amount = new Prisma.Decimal(dto.amount);
      const grant = new Prisma.Decimal(dto.grant ?? 0);
      const ownContribution = new Prisma.Decimal(dto.ownContribution ?? 0);
      if (grant.plus(ownContribution).greaterThan(amount)) {
        throw new ConflictException(
          'Dotacja i wkład własny przekraczają kwotę faktury',
        );
      }
      const link = await this.budget.linkColumns(
        projectId,
        dto.document ?? null,
        tx,
      );

      const actual = await this.ensureActual(projectId, positionKey, tx);
      const invoice = await tx.budgetInvoice.create({
        data: {
          actualId: actual.id,
          number: dto.number,
          contractor: dto.contractor,
          date: new Date(dto.date),
          amount,
          grant,
          ownContribution,
          status: 'TO_BE_PAID',
          enteredById: actor.id,
          ...link,
        },
      });
      await this.setSpent(
        actual.id,
        (await this.spentOf(actual.id, tx)).plus(amount),
        tx,
      );

      return {
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount.toFixed(2),
        contractor: invoice.contractor,
        date: invoice.date.toISOString().slice(0, 10),
        grant: invoice.grant.toFixed(2),
        ownContribution: invoice.ownContribution.toFixed(2),
        enteredBy: `${actor.firstName} ${actor.lastName}`,
        status: invoice.status,
      };
    }, SERIALIZABLE);
  }

  async setInvoiceStatus(
    id: string,
    dto: UpdateBudgetInvoiceStatusDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invoice = await this.locateInvoice(id, tx);
      const projectId = invoice.actual.projectId;
      await this.access.assertCanRead(actor, projectId, tx);
      if (!(await this.access.canManageTasks(actor, projectId, tx))) {
        throw new ForbiddenException(
          'Status faktury zmienia tylko dyrektor lub koordynator projektu',
        );
      }
      await this.access.assertNotArchived(projectId, tx);

      await tx.budgetInvoice.update({
        where: { id },
        data: { status: dto.status },
      });
    }, SERIALIZABLE);
  }

  async deleteInvoice(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const invoice = await this.locateInvoice(id, tx);
      await this.locateWritable(
        invoice.actual.projectId,
        invoice.actual.positionKey,
        actor,
        tx,
      );

      await tx.budgetInvoice.delete({ where: { id } });
      const spent = (await this.spentOf(invoice.actualId, tx)).minus(
        invoice.amount,
      );
      await this.setSpent(
        invoice.actualId,
        spent.isNegative() ? ZERO : spent,
        tx,
      );
    }, SERIALIZABLE);
  }

  async recalculate(
    projectId: string,
    positionKey: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.locateWritable(projectId, positionKey, actor, tx);

      const actual = await this.ensureActual(projectId, positionKey, tx);
      const total = await tx.budgetInvoice.aggregate({
        where: { actualId: actual.id },
        _sum: { amount: true },
      });
      await this.setSpent(actual.id, total._sum.amount ?? ZERO, tx);
    }, SERIALIZABLE);
  }

  async move(
    projectId: string,
    dto: MoveBudgetActualsDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (dto.fromPositionKey === dto.toPositionKey) {
        throw new ConflictException('Wybierz inną pozycję docelową');
      }
      await this.access.assertCanRead(actor, projectId, tx);
      await this.access.assertCanEditBudget(actor, projectId, tx);
      await this.access.assertNotArchived(projectId, tx);
      await this.locatePosition(projectId, dto.fromPositionKey, tx);
      await this.locatePosition(projectId, dto.toPositionKey, tx);

      const source = await tx.budgetActual.findUnique({
        where: {
          projectId_positionKey: {
            projectId,
            positionKey: dto.fromPositionKey,
          },
        },
      });
      if (!source) {
        throw new NotFoundException(
          'Ta pozycja nie ma wydatków do przeniesienia',
        );
      }
      const target = await this.ensureActual(projectId, dto.toPositionKey, tx);

      await tx.budgetInvoice.updateMany({
        where: { actualId: source.id },
        data: { actualId: target.id },
      });
      const moved = await this.spentOf(source.id, tx);
      await this.setSpent(
        target.id,
        (await this.spentOf(target.id, tx)).plus(moved),
        tx,
      );
      await this.setSpent(source.id, ZERO, tx);
    }, SERIALIZABLE);
  }

  private isSummary(position: PositionContext): boolean {
    return position.partnerId !== null && !position.detailed;
  }

  private async locatePosition(
    projectId: string,
    positionKey: string,
    db: Db,
  ): Promise<PositionContext> {
    const open = await this.budget.openVersion(projectId, db);
    const current = await this.budget.currentVersion(projectId, db);

    for (const version of [open, current]) {
      if (!version) continue;
      const position = await db.budgetPosition.findUnique({
        where: { versionId_key: { versionId: version.id, key: positionKey } },
      });
      if (!position) continue;

      const category = await db.budgetCategory.findUnique({
        where: {
          versionId_key: { versionId: version.id, key: position.categoryKey },
        },
      });
      const settings = await db.budgetCategorySettings.findUnique({
        where: {
          projectId_categoryKey: {
            projectId,
            categoryKey: position.categoryKey,
          },
        },
      });

      return {
        projectId,
        positionKey,
        categoryKey: position.categoryKey,
        partnerId: category?.partnerId ?? null,
        detailed: settings?.detailed ?? true,
        partnerCanEdit: settings?.partnerCanEdit ?? false,
        visibleToPartner: settings?.visibleToPartner ?? false,
      };
    }

    throw new NotFoundException('Nie znaleziono pozycji budżetu');
  }

  private async locateWritable(
    projectId: string,
    positionKey: string,
    actor: AuthenticatedUser,
    db: Db,
  ): Promise<PositionContext> {
    await this.access.assertCanRead(actor, projectId, db);
    await this.access.assertCanUseModule(actor, projectId, 'BUDGET', db);
    const position = await this.locatePosition(projectId, positionKey, db);

    if (!(await this.access.canEditBudget(actor, projectId, db))) {
      const scope = await this.budget.partnerScope(actor, projectId, db);
      const partnerMayEdit =
        scope?.partnerId != null &&
        position.partnerId === scope.partnerId &&
        position.visibleToPartner &&
        position.partnerCanEdit;
      if (!partnerMayEdit) {
        throw new ForbiddenException(
          'Nie masz uprawnień do edycji wydatków tej pozycji',
        );
      }
    }

    await this.access.assertNotArchived(projectId, db);
    return position;
  }

  private async locateInvoice(id: string, db: Db) {
    const invoice = await db.budgetInvoice.findUnique({
      where: { id },
      include: { actual: { select: { projectId: true, positionKey: true } } },
    });
    if (!invoice) throw new NotFoundException('Nie znaleziono faktury');
    return invoice;
  }

  private async ensureActual(projectId: string, positionKey: string, db: Db) {
    return db.budgetActual.upsert({
      where: { projectId_positionKey: { projectId, positionKey } },
      update: {},
      create: { projectId, positionKey },
    });
  }

  private async spentOf(actualId: string, db: Db): Promise<Prisma.Decimal> {
    const row = await db.budgetActualValue.findUnique({
      where: {
        actualId_columnKey: { actualId, columnKey: BUDGET_SPENT_COLUMN },
      },
    });
    if (!row || !MONEY_PATTERN.test(row.value)) return ZERO;
    return new Prisma.Decimal(row.value);
  }

  private async setSpent(
    actualId: string,
    value: Prisma.Decimal,
    db: Db,
  ): Promise<void> {
    await db.budgetActualValue.upsert({
      where: {
        actualId_columnKey: { actualId, columnKey: BUDGET_SPENT_COLUMN },
      },
      update: { value: value.toFixed(2) },
      create: {
        actualId,
        columnKey: BUDGET_SPENT_COLUMN,
        value: value.toFixed(2),
      },
    });
  }
}
