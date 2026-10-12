import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from './project-access.service';
import { BudgetService } from './budget.service';
import { BudgetAnnexService } from './budget-annex.service';

describe('BudgetAnnexService', () => {
  let service: BudgetAnnexService;

  const tx = {
    budgetVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    budgetCategory: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    budgetPosition: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    budgetActual: { findMany: jest.fn() },
  };
  const prisma = { $transaction: jest.fn() };

  const access = {
    assertCanRead: jest.fn(),
    assertCanEditBudget: jest.fn(),
    assertNotArchived: jest.fn(),
    assertCanApproveBudget: jest.fn(),
    assertCanUseModule: jest.fn(),
  };
  const budget = {
    locateVersion: jest.fn(),
    currentVersion: jest.fn(),
    openVersion: jest.fn(),
    log: jest.fn(),
  };

  const director = { id: 'dir', isDirector: true } as never;
  const coordinator = { id: 'coord', isDirector: false } as never;

  const version = (overrides: Record<string, unknown> = {}) => ({
    id: 'v2',
    projectId: 'p1',
    number: 2,
    name: 'Aneks 2',
    status: 'DRAFT',
    isCurrent: false,
    createdById: 'coord',
    ...overrides,
  });

  const position = (key: string, planned: number) => ({
    key,
    name: key,
    categoryKey: 'cat',
    sortOrder: 1,
    planned: new Prisma.Decimal(planned),
    grant: new Prisma.Decimal(0),
    ownContribution: new Prisma.Decimal(planned),
  });

  const planOf = (byVersion: Record<string, ReturnType<typeof position>[]>) => {
    tx.budgetPosition.findMany.mockImplementation(
      ({ where }: { where: { versionId: string } }) =>
        Promise.resolve(byVersion[where.versionId] ?? []),
    );
    tx.budgetCategory.findMany.mockResolvedValue([
      { key: 'cat', name: 'Kategoria', partnerId: null, sortOrder: 1 },
    ]);
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetAnnexService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
        { provide: BudgetService, useValue: budget },
      ],
    }).compile();

    service = module.get(BudgetAnnexService);
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => unknown) => fn(tx),
    );
    budget.currentVersion.mockResolvedValue(
      version({ id: 'v1', number: 1, status: 'APPROVED', isCurrent: true }),
    );
    budget.openVersion.mockResolvedValue(null);
  });

  describe('create', () => {
    it('refuses while another aneks is open', async () => {
      budget.openVersion.mockResolvedValue(version());

      await expect(service.create('p1', coordinator)).rejects.toThrow(
        ConflictException,
      );
      expect(tx.budgetVersion.create).not.toHaveBeenCalled();
    });

    it('numbers it after the latest approved and copies the plan with the same keys', async () => {
      tx.budgetVersion.findFirst.mockResolvedValue(
        version({ id: 'v1', number: 1, status: 'APPROVED' }),
      );
      tx.budgetVersion.create.mockResolvedValue(
        version({ id: 'v2', number: 2 }),
      );
      planOf({ v1: [position('shelter', 100)] });

      await service.create('p1', coordinator);

      expect(tx.budgetVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ number: 2, name: 'Aneks 2' }) as object,
      });
      const copied = (
        tx.budgetPosition.createMany.mock.calls[0] as [
          { data: { key: string; versionId: string }[] },
        ]
      )[0].data;
      expect(copied).toEqual([
        expect.objectContaining({ key: 'shelter', versionId: 'v2' }),
      ]);
    });

    it('needs an approved base version first', async () => {
      tx.budgetVersion.findFirst.mockResolvedValue(null);
      budget.currentVersion.mockResolvedValue(null);

      await expect(service.create('p1', coordinator)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('submit', () => {
    it('refuses a draft identical to the current version', async () => {
      budget.locateVersion.mockResolvedValue(version());
      planOf({ v1: [position('a', 100)], v2: [position('a', 100)] });

      await expect(service.submit('v2', coordinator)).rejects.toThrow(
        ConflictException,
      );
      expect(tx.budgetVersion.update).not.toHaveBeenCalled();
    });

    it('moves a changed draft to PENDING and logs it', async () => {
      budget.locateVersion.mockResolvedValue(version());
      planOf({ v1: [position('a', 100)], v2: [position('a', 120)] });

      await service.submit('v2', coordinator);

      expect(tx.budgetVersion.update).toHaveBeenCalledWith({
        where: { id: 'v2' },
        data: expect.objectContaining({
          status: 'PENDING',
          submittedById: 'coord',
        }) as object,
      });
      expect(budget.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ kind: 'SUBMITTED' }),
      );
    });

    it('stops a user without edit rights', async () => {
      budget.locateVersion.mockResolvedValue(version());
      access.assertCanEditBudget.mockRejectedValue(new ForbiddenException());

      await expect(service.submit('v2', coordinator)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('approve', () => {
    it('makes the version current and every other one not current', async () => {
      budget.locateVersion.mockResolvedValue(version({ status: 'PENDING' }));
      planOf({ v1: [position('a', 100)], v2: [position('a', 120)] });
      tx.budgetActual.findMany.mockResolvedValue([]);

      await service.approve('v2', { description: 'Przesunięcie' }, director);

      expect(tx.budgetVersion.updateMany).toHaveBeenCalledWith({
        where: { projectId: 'p1', id: { not: 'v2' } },
        data: { isCurrent: false },
      });
      expect(tx.budgetVersion.update).toHaveBeenCalledWith({
        where: { id: 'v2' },
        data: expect.objectContaining({
          status: 'APPROVED',
          isCurrent: true,
          description: 'Przesunięcie',
        }) as object,
      });
    });

    it('refuses while a removed position still has invoices', async () => {
      budget.locateVersion.mockResolvedValue(version({ status: 'PENDING' }));
      planOf({
        v1: [position('a', 100), position('b', 50)],
        v2: [position('a', 100)],
      });
      tx.budgetActual.findMany.mockResolvedValue([
        { positionKey: 'b', _count: { invoices: 1 }, values: [] },
      ]);

      await expect(
        service.approve('v2', { description: 'x' }, director),
      ).rejects.toThrow(ConflictException);
      expect(tx.budgetVersion.update).not.toHaveBeenCalled();
    });

    it('refuses someone else’s draft', async () => {
      budget.locateVersion.mockResolvedValue(version({ status: 'DRAFT' }));

      await expect(
        service.approve('v2', { description: 'x' }, director),
      ).rejects.toThrow(ConflictException);
    });

    it('is director only', async () => {
      budget.locateVersion.mockResolvedValue(version({ status: 'PENDING' }));
      access.assertCanApproveBudget.mockImplementation(() => {
        throw new ForbiddenException();
      });

      await expect(
        service.approve('v2', { description: 'x' }, coordinator),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reject', () => {
    it('sends a pending version back to draft with the comment in history', async () => {
      budget.locateVersion.mockResolvedValue(version({ status: 'PENDING' }));

      await service.reject('v2', { comment: 'Popraw kwoty' }, director);

      expect(tx.budgetVersion.update).toHaveBeenCalledWith({
        where: { id: 'v2' },
        data: { status: 'DRAFT' },
      });
      expect(budget.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ kind: 'REJECTED', comment: 'Popraw kwoty' }),
      );
    });

    it('refuses a draft', async () => {
      budget.locateVersion.mockResolvedValue(version());

      await expect(
        service.reject('v2', { comment: 'x' }, director),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('revert', () => {
    it('restores the previous approved version', async () => {
      const approved = version({ status: 'APPROVED', isCurrent: true });
      budget.locateVersion.mockResolvedValue(approved);
      tx.budgetVersion.findFirst
        .mockResolvedValueOnce(approved)
        .mockResolvedValueOnce(
          version({ id: 'v1', number: 1, status: 'APPROVED' }),
        );

      await service.revert('v2', { reason: 'Błąd' }, director);

      expect(tx.budgetVersion.update).toHaveBeenCalledWith({
        where: { id: 'v2' },
        data: expect.objectContaining({
          status: 'DRAFT',
          isCurrent: false,
          approvedById: null,
        }) as object,
      });
      expect(tx.budgetVersion.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { isCurrent: true },
      });
    });

    it('never reverts the base version', async () => {
      budget.locateVersion.mockResolvedValue(
        version({ id: 'v0', number: 0, status: 'APPROVED' }),
      );
      tx.budgetVersion.findFirst.mockResolvedValue(
        version({ id: 'v0', number: 0, status: 'APPROVED' }),
      );

      await expect(
        service.revert('v0', { reason: 'x' }, director),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses while an aneks is open', async () => {
      const approved = version({ status: 'APPROVED' });
      budget.locateVersion.mockResolvedValue(approved);
      tx.budgetVersion.findFirst.mockResolvedValue(approved);
      budget.openVersion.mockResolvedValue(version({ id: 'v3', number: 3 }));

      await expect(
        service.revert('v2', { reason: 'x' }, director),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('discard', () => {
    it('deletes the plan and the version, and logs without a version id', async () => {
      budget.locateVersion.mockResolvedValue(version());

      await service.discard('v2', coordinator);

      expect(tx.budgetPosition.deleteMany).toHaveBeenCalledWith({
        where: { versionId: 'v2' },
      });
      expect(tx.budgetVersion.delete).toHaveBeenCalledWith({
        where: { id: 'v2' },
      });
      expect(budget.log).toHaveBeenCalledWith(
        tx,
        expect.objectContaining({ kind: 'DISCARDED', versionId: null }),
      );
    });

    it('refuses an approved version', async () => {
      budget.locateVersion.mockResolvedValue(version({ status: 'APPROVED' }));

      await expect(service.discard('v2', coordinator)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
