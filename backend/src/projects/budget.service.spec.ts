import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from './project-access.service';
import { BudgetService } from './budget.service';

describe('BudgetService', () => {
  let service: BudgetService;

  const makeClient = () => ({
    project: { findUnique: jest.fn() },
    projectMember: { findUnique: jest.fn() },
    budgetAccess: { count: jest.fn(), create: jest.fn() },
    budgetPosition: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    partner: { findMany: jest.fn(), findFirst: jest.fn() },
    folder: { findMany: jest.fn(), count: jest.fn() },
    document: { findMany: jest.fn(), count: jest.fn() },
    budgetVersion: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    budgetCategory: {
      aggregate: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    budgetColumn: {
      count: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    budgetActual: { findMany: jest.fn() },
    budgetCategorySettings: { findMany: jest.fn() },
    budgetHistoryEntry: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  });

  const tx = makeClient();
  const prisma = { ...makeClient(), $transaction: jest.fn() };

  const access = {
    assertCanRead: jest.fn(),
    canEditBudget: jest.fn(),
    canManageTasks: jest.fn(),
    canUseModule: jest.fn(),
    assertCanEditBudget: jest.fn(),
    assertNotArchived: jest.fn(),
    assertCanUseModule: jest.fn(),
    assertCanManageBudgetAccess: jest.fn(),
  };

  const viewer = { id: 'u1', isDirector: false } as never;
  const person = { id: 'u1', firstName: 'Anna', lastName: 'Kowalczyk' };
  const money = (value: number) => new Prisma.Decimal(value);

  const storedVersion = {
    id: 'v1',
    projectId: 'p1',
    number: 0,
    name: 'Wersja podstawowa',
    status: 'APPROVED',
    isCurrent: true,
    description: '',
    createdAt: new Date('2026-01-15'),
    submittedAt: null,
    approvedAt: new Date('2026-01-20'),
    savedAt: null,
    createdBy: person,
    submittedBy: null,
    approvedBy: person,
    categories: [
      { id: 'c1', key: 'own', name: 'Fundacja', partnerId: null, sortOrder: 1 },
      { id: 'c2', key: 'shared', name: 'Gmina', partnerId: 'gl', sortOrder: 2 },
      {
        id: 'c3',
        key: 'hidden',
        name: 'Gmina 2',
        partnerId: 'gl',
        sortOrder: 3,
      },
    ],
    positions: ['own', 'shared', 'hidden'].map((categoryKey, index) => ({
      id: `p${index}`,
      key: `${categoryKey}-pos`,
      categoryKey,
      name: categoryKey,
      sortOrder: 1,
      planned: money(100),
      grant: money(80),
      ownContribution: money(20),
    })),
  };

  const seedRead = () => {
    prisma.budgetVersion.count.mockResolvedValue(1);
    prisma.budgetVersion.findMany.mockResolvedValue([storedVersion]);
    prisma.budgetColumn.findMany.mockResolvedValue([]);
    prisma.budgetActual.findMany.mockResolvedValue(
      ['own-pos', 'shared-pos', 'hidden-pos'].map((positionKey) => ({
        positionKey,
        status: null,
        documentFolderId: null,
        documentId: null,
        values: [{ columnKey: 'incurred', value: '50.00' }],
        invoices: [],
      })),
    );
    prisma.budgetCategorySettings.findMany.mockResolvedValue([
      {
        categoryKey: 'shared',
        detailed: false,
        partnerCanEdit: false,
        visibleToPartner: true,
        documentFolderId: null,
        documentId: null,
      },
    ]);
    prisma.budgetHistoryEntry.findMany.mockResolvedValue([
      {
        id: 'h1',
        versionId: 'v1',
        versionName: 'Wersja podstawowa',
        kind: 'APPROVED',
        comment: 'ok',
        actorId: 'dir',
        at: new Date('2026-01-20'),
        actor: { id: 'dir', firstName: 'Joanna', lastName: 'Nowicka' },
      },
    ]);
    prisma.partner.findMany.mockResolvedValue([
      { id: 'gl', name: 'Gmina Lutowiska', status: 'ACTIVE' },
      { id: 'fb', name: 'Fundacja Bieszczadzka', status: 'ACTIVE' },
    ]);
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(BudgetService);
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => unknown) => fn(tx),
    );
  });

  describe('getStore', () => {
    it('returns everything to an editor, with ids being the stable keys', async () => {
      seedRead();
      access.canEditBudget.mockResolvedValue(true);

      const store = await service.getStore('p1', viewer);

      expect(store.versions[0].categories.map((c) => c.id)).toEqual([
        'own',
        'shared',
        'hidden',
      ]);
      expect(store.versions[0].categories[0].positions[0]).toEqual({
        id: 'own-pos',
        name: 'own',
        planned: '100.00',
        grant: '80.00',
        ownContribution: '20.00',
      });
      expect(Object.keys(store.actuals)).toHaveLength(3);
      expect(store.permissions).toEqual(
        expect.objectContaining({ canEdit: true, canApprove: false }),
      );
    });

    it('shows a partner user only their shared categories', async () => {
      seedRead();
      access.canEditBudget.mockResolvedValue(false);
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'PARTNER',
        partnerId: 'gl',
      });

      const store = await service.getStore('p1', viewer);

      expect(store.versions[0].categories.map((c) => c.id)).toEqual(['shared']);
      expect(Object.keys(store.actuals)).toEqual(['shared-pos']);
      expect(store.history).toEqual([]);
      expect(store.partners.map((p) => p.id)).toEqual(['gl']);
      expect(store.permissions.partnerId).toBe('gl');
    });

    it('shows nothing to a partner user not linked to an organisation', async () => {
      seedRead();
      access.canEditBudget.mockResolvedValue(false);
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'PARTNER',
        partnerId: null,
      });

      const store = await service.getStore('p1', viewer);

      expect(store.versions[0].categories).toEqual([]);
      expect(store.actuals).toEqual({});
    });

    it('hides document links from a viewer without Dokumenty in the project', async () => {
      seedRead();
      prisma.budgetCategorySettings.findMany.mockResolvedValue([
        {
          categoryKey: 'shared',
          detailed: true,
          partnerCanEdit: false,
          visibleToPartner: true,
          documentFolderId: 'f1',
          documentId: 'd1',
        },
      ]);
      access.canEditBudget.mockResolvedValue(true);
      access.canUseModule.mockResolvedValue(false);

      const store = await service.getStore('p1', viewer);

      expect(store.categorySettings.shared.document).toBeNull();
      expect(prisma.document.findMany).not.toHaveBeenCalled();
    });

    it('does not create the budget for a reader without edit rights', async () => {
      seedRead();
      prisma.budgetVersion.count.mockResolvedValue(0);
      access.canEditBudget.mockResolvedValue(false);

      await service.getStore('p1', viewer);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('treats a concurrent first read as already created', async () => {
      seedRead();
      prisma.budgetVersion.count.mockResolvedValue(0);
      prisma.project.findUnique.mockResolvedValue({ archivedAt: null });
      access.canEditBudget.mockResolvedValue(true);
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('deadlock', {
          code: 'P2034',
          clientVersion: 'test',
        }),
      );

      await expect(service.getStore('p1', viewer)).resolves.toBeDefined();
    });

    it('creates the base version and default columns on the first read', async () => {
      seedRead();
      access.canEditBudget.mockResolvedValue(true);
      prisma.budgetVersion.count.mockResolvedValue(0);
      prisma.project.findUnique.mockResolvedValue({ archivedAt: null });
      tx.budgetVersion.count.mockResolvedValue(0);
      tx.budgetColumn.count.mockResolvedValue(0);
      tx.budgetVersion.create.mockResolvedValue({
        id: 'v1',
        name: 'Wersja podstawowa',
      });

      await service.getStore('p1', viewer);

      expect(tx.budgetVersion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          number: 0,
          name: 'Wersja podstawowa',
          status: 'DRAFT',
        }) as object,
      });
      const columns = (
        tx.budgetColumn.createMany.mock.calls[0] as [
          { data: { key: string }[] },
        ]
      )[0].data.map((column) => column.key);
      expect(columns).toEqual(['planned', 'incurred']);
    });

    it('does not create anything on an archived project', async () => {
      seedRead();
      access.canEditBudget.mockResolvedValue(true);
      prisma.budgetVersion.count.mockResolvedValue(0);
      prisma.project.findUnique.mockResolvedValue({ archivedAt: new Date() });

      await service.getStore('p1', viewer);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('createCategory', () => {
    it('refuses to edit an approved version', async () => {
      tx.budgetVersion.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        status: 'APPROVED',
      });

      await expect(
        service.createCategory('v1', { name: 'Nowa' }, viewer),
      ).rejects.toThrow(ConflictException);
      expect(tx.budgetCategory.create).not.toHaveBeenCalled();
    });

    it('refuses a user without edit rights', async () => {
      tx.budgetVersion.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        status: 'DRAFT',
      });
      access.assertCanEditBudget.mockRejectedValue(new ForbiddenException());

      await expect(
        service.createCategory('v1', { name: 'Nowa' }, viewer),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses a partner not linked to the project', async () => {
      tx.budgetVersion.findUnique.mockResolvedValue({
        id: 'v1',
        projectId: 'p1',
        status: 'DRAFT',
      });
      tx.partner.findFirst.mockResolvedValue(null);

      await expect(
        service.createCategory('v1', { name: 'Nowa', partnerId: 'x' }, viewer),
      ).rejects.toThrow(ConflictException);
    });

    it('generates a key, updates savedAt and logs the edit', async () => {
      tx.budgetVersion.findUnique.mockResolvedValue({
        id: 'v2',
        projectId: 'p1',
        name: 'Aneks 1',
        status: 'DRAFT',
      });
      tx.budgetCategory.aggregate.mockResolvedValue({
        _max: { sortOrder: 2 },
      });
      tx.budgetCategory.create.mockImplementation(
        ({ data }: { data: object }) => Promise.resolve(data),
      );
      tx.budgetHistoryEntry.findFirst.mockResolvedValue(null);

      const category = await service.createCategory(
        'v2',
        { name: 'Promocja' },
        viewer,
      );

      expect(category.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(tx.budgetCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ sortOrder: 3 }) as object,
      });
      expect(tx.budgetVersion.update).toHaveBeenCalledWith({
        where: { id: 'v2' },
        data: { savedAt: expect.any(Date) as Date },
      });
      expect(tx.budgetHistoryEntry.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ kind: 'EDITED' }) as object,
      });
    });
  });

  describe('plan edits', () => {
    const draft = {
      id: 'v2',
      projectId: 'p1',
      name: 'Aneks 2',
      status: 'DRAFT',
    };

    it('refuses to edit an aneks waiting for approval', async () => {
      tx.budgetVersion.findUnique.mockResolvedValue({
        ...draft,
        status: 'PENDING',
      });

      await expect(
        service.createCategory('v2', { name: 'Nowa' }, viewer),
      ).rejects.toThrow(/Wycofaj/);
    });

    it('refuses to delete a draft-only position that already has invoices', async () => {
      tx.budgetVersion.findUnique.mockResolvedValue(draft);
      tx.budgetPosition.findUnique.mockResolvedValue({
        id: 'row',
        key: 'new-pos',
        name: 'Nowa pozycja',
      });
      tx.budgetVersion.findFirst.mockResolvedValue({ id: 'v1' });
      tx.budgetPosition.findMany.mockResolvedValue([{ key: 'old-pos' }]);
      tx.budgetActual.findMany.mockResolvedValue([
        { positionKey: 'new-pos', _count: { invoices: 2 }, values: [] },
      ]);

      await expect(
        service.deletePosition('v2', 'new-pos', viewer),
      ).rejects.toThrow(/ma już wydatki/);
      expect(tx.budgetPosition.delete).not.toHaveBeenCalled();
    });

    it('lets a position still in the current version be deleted from the draft', async () => {
      tx.budgetVersion.findUnique.mockResolvedValue(draft);
      tx.budgetPosition.findUnique.mockResolvedValue({
        id: 'row',
        key: 'old-pos',
        name: 'Stara',
      });
      tx.budgetVersion.findFirst.mockResolvedValue({ id: 'v1' });
      tx.budgetPosition.findMany.mockResolvedValue([{ key: 'old-pos' }]);
      tx.budgetHistoryEntry.findFirst.mockResolvedValue(null);

      await service.deletePosition('v2', 'old-pos', viewer);

      expect(tx.budgetActual.findMany).not.toHaveBeenCalled();
      expect(tx.budgetPosition.delete).toHaveBeenCalledWith({
        where: { id: 'row' },
      });
    });
  });

  describe('grantAccess', () => {
    const member = (overrides: Record<string, unknown> = {}) => ({
      projectRole: 'EXECUTOR',
      modules: [{ id: 'm1' }],
      user: { accountStatus: 'ACTIVE', deletedAt: null },
      ...overrides,
    });

    it('refuses a member without Budżet in the project', async () => {
      tx.projectMember.findUnique.mockResolvedValue(member({ modules: [] }));

      await expect(
        service.grantAccess('p1', { userId: 'u2' }, viewer),
      ).rejects.toThrow(ConflictException);
      expect(tx.budgetAccess.create).not.toHaveBeenCalled();
    });

    it('refuses an inactive account', async () => {
      tx.projectMember.findUnique.mockResolvedValue(
        member({ user: { accountStatus: 'INACTIVE', deletedAt: null } }),
      );

      await expect(
        service.grantAccess('p1', { userId: 'u2' }, viewer),
      ).rejects.toThrow(ConflictException);
    });

    it('grants a member who has Budżet', async () => {
      tx.projectMember.findUnique.mockResolvedValue(member());
      tx.budgetAccess.count.mockResolvedValue(0);

      await service.grantAccess('p1', { userId: 'u2' }, viewer);

      expect(tx.budgetAccess.create).toHaveBeenCalled();
    });
  });

  describe('log', () => {
    const edit = {
      projectId: 'p1',
      versionId: 'v2',
      versionName: 'Aneks 1',
      kind: 'EDITED' as const,
      actorId: 'u1',
    };

    it('merges an edit into the same actor’s edit from minutes ago', async () => {
      tx.budgetHistoryEntry.findFirst.mockResolvedValue({
        id: 'h9',
        kind: 'EDITED',
        versionId: 'v2',
        actorId: 'u1',
        at: new Date(Date.now() - 5 * 60 * 1000),
      });

      await service.log(tx as never, edit);

      expect(tx.budgetHistoryEntry.update).toHaveBeenCalledWith({
        where: { id: 'h9' },
        data: { at: expect.any(Date) as Date },
      });
      expect(tx.budgetHistoryEntry.create).not.toHaveBeenCalled();
    });

    it('starts a new entry after the merge window', async () => {
      tx.budgetHistoryEntry.findFirst.mockResolvedValue({
        id: 'h9',
        kind: 'EDITED',
        versionId: 'v2',
        actorId: 'u1',
        at: new Date(Date.now() - 31 * 60 * 1000),
      });

      await service.log(tx as never, edit);

      expect(tx.budgetHistoryEntry.create).toHaveBeenCalled();
    });

    it('starts a new entry for a different person', async () => {
      tx.budgetHistoryEntry.findFirst.mockResolvedValue({
        id: 'h9',
        kind: 'EDITED',
        versionId: 'v2',
        actorId: 'someone-else',
        at: new Date(),
      });

      await service.log(tx as never, edit);

      expect(tx.budgetHistoryEntry.create).toHaveBeenCalled();
    });
  });

  describe('renameColumn', () => {
    it('refuses a locked column', async () => {
      tx.budgetColumn.findUnique.mockResolvedValue({
        id: 'col',
        locked: true,
      });

      await expect(
        service.renameColumn('p1', 'planned', { name: 'X' }, viewer),
      ).rejects.toThrow(ConflictException);
    });
  });
});
