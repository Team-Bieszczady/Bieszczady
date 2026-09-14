import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StageCompletionService } from './stage-completion.service';
import { ProjectAccessService } from './project-access.service';
import { StagesService } from './stages.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

describe('StagesService.findAllForProject', () => {
  let service: StagesService;

  const access = { assertCanRead: jest.fn(), assertExists: jest.fn() };
  const director = { id: 'd1', isDirector: true } as AuthenticatedUser;

  const prisma = {
    project: { count: jest.fn() },
    stage: { findMany: jest.fn() },
    task: { count: jest.fn() },
  };

  const stage = (
    id: string,
    activities: { id: string; tasks: { status: string }[] }[],
  ) => ({
    id,
    projectId: 'p1',
    name: `Stage ${id}`,
    description: '',
    sortOrder: 1,
    startDate: null,
    deadline: new Date('2026-10-31'),
    originalDeadline: null,
    deadlineNote: null,
    completedAt: null,
    archivedAt: null,
    activities: activities.map((activity, index) => ({
      id: activity.id,
      name: `Activity ${activity.id}`,
      sortOrder: index + 1,
      tasks: activity.tasks,
    })),
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StagesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StageCompletionService, useValue: { settle: jest.fn() } },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(StagesService);
    prisma.project.count.mockResolvedValue(1);
  });

  it('derives counts from the nested tasks across every activity', async () => {
    prisma.stage.findMany.mockResolvedValue([
      stage('s1', [
        { id: 'a1', tasks: [{ status: 'DONE' }, { status: 'NEW' }] },
        { id: 'a2', tasks: [{ status: 'DONE' }, { status: 'BLOCKED' }] },
      ]),
    ]);

    const [result] = await service.findAllForProject('p1', false, director);

    expect(result.counts).toEqual({ total: 4, done: 2, pending: 2 });
  });

  it('counts only DONE as finished, so a BLOCKED task keeps the stage pending', async () => {
    prisma.stage.findMany.mockResolvedValue([
      stage('s1', [
        { id: 'a1', tasks: [{ status: 'BLOCKED' }, { status: 'IN_PROGRESS' }] },
      ]),
    ]);

    const [result] = await service.findAllForProject('p1', false, director);

    expect(result.counts).toEqual({ total: 2, done: 0, pending: 2 });
  });

  it('reports zeroes for a stage with no activities', async () => {
    prisma.stage.findMany.mockResolvedValue([stage('s1', [])]);

    const [result] = await service.findAllForProject('p1', false, director);

    expect(result.counts).toEqual({ total: 0, done: 0, pending: 0 });
    expect(result.activities).toEqual([]);
  });

  it('exposes each activity with its task rows and a matching taskCount', async () => {
    prisma.stage.findMany.mockResolvedValue([
      stage('s1', [
        { id: 'a1', tasks: [{ status: 'DONE' }, { status: 'NEW' }] },
      ]),
    ]);

    const [result] = await service.findAllForProject('p1', false, director);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].taskCount).toBe(2);
    expect(result.activities[0].tasks).toHaveLength(2);
  });

  it('never falls back to counting tasks with a query', async () => {
    prisma.stage.findMany.mockResolvedValue([
      stage('s1', [{ id: 'a1', tasks: [{ status: 'DONE' }] }]),
    ]);

    await service.findAllForProject('p1', false, director);

    expect(prisma.task.count).not.toHaveBeenCalled();
  });
});
