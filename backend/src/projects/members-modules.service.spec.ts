import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MembersService } from './members.service';
import { ProjectAccessService } from './project-access.service';

describe('MembersService per-project modules', () => {
  let service: MembersService;

  const tx = {
    project: { findUnique: jest.fn() },
    user: { findFirst: jest.fn() },
    projectMember: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    projectMemberModule: { deleteMany: jest.fn(), createMany: jest.fn() },
    documentAccess: { deleteMany: jest.fn() },
    budgetAccess: { deleteMany: jest.fn() },
  };

  const prisma = {
    projectMember: { findMany: jest.fn() },
    budgetAccess: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const access = { assertNotArchived: jest.fn(), assertCanRead: jest.fn() };

  const stored = (modules: string[]) => ({
    id: 'm1',
    projectId: 'p1',
    userId: 'anna',
    projectRole: 'EXECUTOR',
    modules: modules.map((module) => ({ module })),
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(MembersService);
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => unknown) => fn(tx),
    );
    tx.user.findFirst.mockResolvedValue({
      id: 'anna',
      accountStatus: 'ACTIVE',
    });
    tx.projectMember.count.mockResolvedValue(0);
    tx.projectMember.findUnique.mockResolvedValue(stored([]));
  });

  describe('add', () => {
    it('gives every module when none are sent', async () => {
      tx.projectMember.create.mockResolvedValue(
        stored(['TASKS', 'BUDGET', 'DOCUMENTS']),
      );

      const member = await service.add('p1', {
        userId: 'anna',
        projectRole: 'EXECUTOR',
      });

      expect(tx.projectMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modules: {
              create: [
                { module: 'TASKS' },
                { module: 'BUDGET' },
                { module: 'DOCUMENTS' },
              ],
            },
          }) as object,
        }),
      );
      expect(member.modules).toEqual(['TASKS', 'BUDGET', 'DOCUMENTS']);
    });

    it('stores only the modules that were ticked', async () => {
      tx.projectMember.create.mockResolvedValue(stored(['TASKS']));

      await service.add('p1', {
        userId: 'anna',
        projectRole: 'EXECUTOR',
        modules: ['TASKS'],
      });

      expect(tx.projectMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modules: { create: [{ module: 'TASKS' }] },
          }) as object,
        }),
      );
    });
  });

  describe('setRole', () => {
    it('replaces the modules and drops budget edit rights without Budżet', async () => {
      tx.projectMember.update.mockResolvedValue(stored(['DOCUMENTS']));

      const member = await service.setRole('m1', {
        projectRole: 'EXECUTOR',
        modules: ['DOCUMENTS'],
      });

      expect(tx.projectMemberModule.deleteMany).toHaveBeenCalledWith({
        where: { memberId: 'm1' },
      });
      expect(tx.projectMemberModule.createMany).toHaveBeenCalledWith({
        data: [{ memberId: 'm1', module: 'DOCUMENTS' }],
      });
      expect(tx.budgetAccess.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'p1', userId: 'anna' },
      });
      expect(member.modules).toEqual(['DOCUMENTS']);
    });

    it('keeps budget edit rights while Budżet stays ticked', async () => {
      tx.projectMember.update.mockResolvedValue(stored(['BUDGET']));

      await service.setRole('m1', {
        projectRole: 'EXECUTOR',
        modules: ['BUDGET'],
      });

      expect(tx.budgetAccess.deleteMany).not.toHaveBeenCalled();
    });

    it('leaves the modules alone when only the role is sent', async () => {
      tx.projectMember.update.mockResolvedValue(stored(['TASKS']));

      await service.setRole('m1', { projectRole: 'PARTNER' });

      expect(tx.projectMemberModule.deleteMany).not.toHaveBeenCalled();
      expect(tx.budgetAccess.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('findForUser', () => {
    it('lists live projects with modules and budget edit rights', async () => {
      prisma.projectMember.findMany.mockResolvedValue([
        {
          projectId: 'p1',
          projectRole: 'EXECUTOR',
          project: { name: 'Solina' },
          modules: [{ module: 'TASKS' }],
        },
        {
          projectId: 'p2',
          projectRole: 'EXECUTOR',
          project: { name: 'Wetlina' },
          modules: [{ module: 'BUDGET' }],
        },
        {
          projectId: 'p3',
          projectRole: 'COORDINATOR',
          project: { name: 'Ustrzyki' },
          modules: [],
        },
      ]);
      prisma.budgetAccess.findMany.mockResolvedValue([{ projectId: 'p2' }]);

      await expect(service.findForUser('anna')).resolves.toEqual([
        {
          projectId: 'p1',
          projectName: 'Solina',
          projectRole: 'EXECUTOR',
          modules: ['TASKS'],
          canEditBudget: false,
        },
        {
          projectId: 'p2',
          projectName: 'Wetlina',
          projectRole: 'EXECUTOR',
          modules: ['BUDGET'],
          canEditBudget: true,
        },
        {
          projectId: 'p3',
          projectName: 'Ustrzyki',
          projectRole: 'COORDINATOR',
          modules: ['TASKS', 'BUDGET', 'DOCUMENTS'],
          canEditBudget: true,
        },
      ]);
      expect(prisma.projectMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'anna', project: { archivedAt: null } },
        }),
      );
    });
  });
});
