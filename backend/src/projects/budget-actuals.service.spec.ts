import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from './project-access.service';
import { BudgetService } from './budget.service';
import { BudgetActualsService } from './budget-actuals.service';

describe('BudgetActualsService', () => {
  let service: BudgetActualsService;

  const tx = {
    budgetPosition: { findUnique: jest.fn() },
    budgetCategory: { findUnique: jest.fn() },
    budgetCategorySettings: { findUnique: jest.fn() },
    budgetColumn: { findUnique: jest.fn() },
    budgetActual: {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    budgetActualValue: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    budgetInvoice: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      aggregate: jest.fn(),
    },
  };
  const prisma = { $transaction: jest.fn() };

  const access = {
    assertCanRead: jest.fn(),
    canEditBudget: jest.fn(),
    assertCanEditBudget: jest.fn(),
    assertNotArchived: jest.fn(),
    canManageTasks: jest.fn(),
    assertCanUseModule: jest.fn(),
  };
  const budget = {
    openVersion: jest.fn(),
    currentVersion: jest.fn(),
    partnerScope: jest.fn(),
    linkColumns: jest.fn(),
  };

  const editor = {
    id: 'coord',
    firstName: 'Anna',
    lastName: 'Kowalczyk',
    isDirector: false,
  } as never;
  const partnerUser = { id: 'pu', isDirector: false } as never;

  const spentWrites = () =>
    tx.budgetActualValue.upsert.mock.calls.map(
      (call) =>
        (call as [{ update: { value: string }; where: unknown }])[0].update
          .value,
    );

  const useCategory = (
    partnerId: string | null,
    settings: Record<string, boolean> | null = null,
  ) => {
    tx.budgetCategory.findUnique.mockResolvedValue({ partnerId });
    tx.budgetCategorySettings.findUnique.mockResolvedValue(settings);
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetActualsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
        { provide: BudgetService, useValue: budget },
      ],
    }).compile();

    service = module.get(BudgetActualsService);
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => unknown) => fn(tx),
    );
    budget.currentVersion.mockResolvedValue({ id: 'v1' });
    budget.openVersion.mockResolvedValue(null);
    budget.linkColumns.mockResolvedValue({
      documentFolderId: null,
      documentId: null,
    });
    tx.budgetPosition.findUnique.mockResolvedValue({
      key: 'pos',
      categoryKey: 'cat',
    });
    tx.budgetActual.upsert.mockResolvedValue({ id: 'a1' });
    tx.budgetInvoice.create.mockResolvedValue({
      id: 'i1',
      number: 'FV/1',
      contractor: 'Budmax',
      date: new Date('2026-02-14'),
      amount: new Prisma.Decimal(1000),
      grant: new Prisma.Decimal(0),
      ownContribution: new Prisma.Decimal(0),
      status: 'TO_BE_PAID',
    });
    access.canEditBudget.mockResolvedValue(true);
    useCategory(null);
  });

  describe('addInvoice', () => {
    const invoice = {
      number: 'FV/1',
      contractor: 'Budmax',
      date: '2026-02-14',
      amount: '1000',
    };

    it('adds the amount to incurred', async () => {
      tx.budgetActualValue.findUnique.mockResolvedValue({ value: '500.00' });

      await service.addInvoice('p1', 'pos', invoice, editor);

      expect(tx.budgetInvoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'TO_BE_PAID',
          enteredById: 'coord',
        }) as object,
      });
      expect(spentWrites()).toEqual(['1500.00']);
    });

    it('refuses grant and own contribution above the amount', async () => {
      await expect(
        service.addInvoice(
          'p1',
          'pos',
          { ...invoice, grant: '800', ownContribution: '300' },
          editor,
        ),
      ).rejects.toThrow(ConflictException);
      expect(tx.budgetInvoice.create).not.toHaveBeenCalled();
    });

    it('refuses invoices in summary mode', async () => {
      useCategory('partner-2', { detailed: false });

      await expect(
        service.addInvoice('p1', 'pos', invoice, editor),
      ).rejects.toThrow(ConflictException);
    });

    it('lets a partner user add to their own shared, editable category', async () => {
      access.canEditBudget.mockResolvedValue(false);
      budget.partnerScope.mockResolvedValue({ partnerId: 'partner-2' });
      useCategory('partner-2', {
        detailed: true,
        visibleToPartner: true,
        partnerCanEdit: true,
      });

      await service.addInvoice('p1', 'pos', invoice, partnerUser);

      expect(tx.budgetInvoice.create).toHaveBeenCalled();
    });

    it('stops a partner user when editing is not allowed', async () => {
      access.canEditBudget.mockResolvedValue(false);
      budget.partnerScope.mockResolvedValue({ partnerId: 'partner-2' });
      useCategory('partner-2', {
        detailed: true,
        visibleToPartner: true,
        partnerCanEdit: false,
      });

      await expect(
        service.addInvoice('p1', 'pos', invoice, partnerUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('stops an executor without budget access', async () => {
      access.canEditBudget.mockResolvedValue(false);
      budget.partnerScope.mockResolvedValue(null);

      await expect(
        service.addInvoice('p1', 'pos', invoice, editor),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteInvoice', () => {
    it('subtracts the amount and never goes below zero', async () => {
      tx.budgetInvoice.findUnique.mockResolvedValue({
        id: 'i1',
        actualId: 'a1',
        amount: new Prisma.Decimal(1000),
        actual: { projectId: 'p1', positionKey: 'pos' },
      });
      tx.budgetActualValue.findUnique.mockResolvedValue({ value: '400.00' });

      await service.deleteInvoice('i1', editor);

      expect(tx.budgetInvoice.delete).toHaveBeenCalledWith({
        where: { id: 'i1' },
      });
      expect(spentWrites()).toEqual(['0.00']);
    });
  });

  describe('updateCell', () => {
    beforeEach(() => {
      tx.budgetColumn.findUnique.mockResolvedValue({ type: 'money' });
    });

    it('refuses plan amounts', async () => {
      await expect(
        service.updateCell('p1', 'pos', 'planned', { value: '10' }, editor),
      ).rejects.toThrow(ConflictException);
    });

    it('lets an editor type incurred in detailed mode', async () => {
      await service.updateCell(
        'p1',
        'pos',
        'incurred',
        { value: '10' },
        editor,
      );

      expect(spentWrites()).toEqual(['10.00']);
    });

    it('refuses a partner user typing incurred in detailed mode', async () => {
      access.canEditBudget.mockResolvedValue(false);
      budget.partnerScope.mockResolvedValue({ partnerId: 'partner-2' });
      useCategory('partner-2', {
        detailed: true,
        visibleToPartner: true,
        partnerCanEdit: true,
      });

      await expect(
        service.updateCell(
          'p1',
          'pos',
          'incurred',
          { value: '10' },
          partnerUser,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('normalises a money value with a comma', async () => {
      useCategory('partner-2', { detailed: false });

      await service.updateCell(
        'p1',
        'pos',
        'incurred',
        { value: '1 500,5' },
        editor,
      );

      expect(spentWrites()).toEqual(['1500.50']);
    });

    it('clears the cell for an empty value', async () => {
      tx.budgetColumn.findUnique.mockResolvedValue({ type: 'text' });

      await service.updateCell('p1', 'pos', 'person', { value: '' }, editor);

      expect(tx.budgetActualValue.deleteMany).toHaveBeenCalledWith({
        where: { actualId: 'a1', columnKey: 'person' },
      });
    });
  });

  describe('updateActual', () => {
    it('refuses a manual status in detailed mode', async () => {
      await expect(
        service.updateActual('p1', 'pos', { status: 'PAID' }, editor),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('setInvoiceStatus', () => {
    it('is director or coordinator only', async () => {
      tx.budgetInvoice.findUnique.mockResolvedValue({
        id: 'i1',
        actual: { projectId: 'p1', positionKey: 'pos' },
      });
      access.canManageTasks.mockResolvedValue(false);

      await expect(
        service.setInvoiceStatus('i1', { status: 'PAID' }, editor),
      ).rejects.toThrow(ForbiddenException);
      expect(tx.budgetInvoice.update).not.toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('moves the invoices and adds incurred to the target', async () => {
      tx.budgetActual.findUnique.mockResolvedValue({ id: 'src' });
      tx.budgetActual.upsert.mockResolvedValue({ id: 'dst' });
      tx.budgetActualValue.findUnique
        .mockResolvedValueOnce({ value: '300.00' })
        .mockResolvedValueOnce({ value: '200.00' });

      await service.move(
        'p1',
        { fromPositionKey: 'old', toPositionKey: 'new' },
        editor,
      );

      expect(tx.budgetInvoice.updateMany).toHaveBeenCalledWith({
        where: { actualId: 'src' },
        data: { actualId: 'dst' },
      });
      expect(spentWrites()).toEqual(['500.00', '0.00']);
    });

    it('refuses moving onto the same position', async () => {
      await expect(
        service.move(
          'p1',
          { fromPositionKey: 'a', toPositionKey: 'a' },
          editor,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
