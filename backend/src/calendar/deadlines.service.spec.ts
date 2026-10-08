import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleAccessService } from '../users/module-access.service';
import { DeadlinesService } from './deadlines.service';

describe('DeadlinesService', () => {
  let service: DeadlinesService;

  const prisma = { task: { findMany: jest.fn() } };
  const moduleAccess = { userHasModule: jest.fn() };

  const october = { from: '2026-10-01', to: '2026-10-31' };
  const director = { id: 'director-1', isDirector: true };
  const member = { id: 'member-1', isDirector: false };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadlinesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ModuleAccessService, useValue: moduleAccess },
      ],
    }).compile();

    service = module.get(DeadlinesService);
    prisma.task.findMany.mockResolvedValue([]);
    moduleAccess.userHasModule.mockResolvedValue(true);
  });

  it('rejects a range that ends before it starts', async () => {
    await expect(
      service.findInRange({ from: '2026-10-31', to: '2026-10-01' }, director),
    ).rejects.toThrow(BadRequestException);
  });

  it('shows a director task deadlines from every open stage', async () => {
    await service.findInRange(october, director);

    const [args] = prisma.task.findMany.mock.calls[0] as [object];
    expect(args).toMatchObject({
      where: {
        dueDate: {
          gte: new Date('2026-10-01'),
          lte: new Date('2026-10-31'),
        },
        activity: { stage: { archivedAt: null } },
      },
    });
  });

  it('shows anyone else only deadlines from projects they belong to', async () => {
    await service.findInRange(october, member);

    const [args] = prisma.task.findMany.mock.calls[0] as [object];
    expect(args).toMatchObject({
      where: {
        activity: {
          stage: {
            archivedAt: null,
            project: { members: { some: { userId: 'member-1' } } },
          },
        },
      },
    });
  });

  it('shows nothing to someone without access to tasks', async () => {
    moduleAccess.userHasModule.mockResolvedValue(false);

    await expect(service.findInRange(october, member)).resolves.toEqual([]);
    expect(prisma.task.findMany).not.toHaveBeenCalled();
  });

  it('returns each deadline with its project and stage', async () => {
    const dueDate = new Date('2026-10-15');
    prisma.task.findMany.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Wniosek',
        status: 'NEW',
        dueDate,
        owner: null,
        activity: {
          stage: {
            name: 'Etap 1',
            projectId: 'project-1',
            project: { name: 'Szlak' },
          },
        },
      },
    ]);

    await expect(service.findInRange(october, director)).resolves.toEqual([
      {
        id: 'task-1',
        title: 'Wniosek',
        status: 'NEW',
        dueDate,
        owner: null,
        projectId: 'project-1',
        projectName: 'Szlak',
        stageName: 'Etap 1',
      },
    ]);
  });
});
