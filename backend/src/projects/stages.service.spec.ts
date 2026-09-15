import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StageCompletionService } from './stage-completion.service';
import { ProjectAccessService } from './project-access.service';
import { StagesService } from './stages.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

describe('StagesService.findAllForProject', () => {
  let service: StagesService;

  const access = {
    assertCanRead: jest.fn(),
    assertExists: jest.fn(),
    assertNotArchived: jest.fn(),
  };
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

describe('StagesService: an archived project is read-only', () => {
  let service: StagesService;

  const access = {
    assertCanRead: jest.fn(),
    assertExists: jest.fn(),
    assertNotArchived: jest.fn(),
  };

  const prisma = {
    project: { findUnique: jest.fn() },
    stage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    activity: { count: jest.fn() },
    $transaction: jest.fn(),
  };

  const stageRow = (id: string, projectId: string) => ({
    id,
    projectId,
    project: { startDate: null, plannedEndDate: null },
    name: `Stage ${id}`,
    description: '',
    sortOrder: 1,
    startDate: null,
    deadline: new Date('2026-10-31'),
    originalDeadline: null,
    deadlineNote: null,
    completedAt: null,
    archivedAt: null,
  });

  const archived = () =>
    access.assertNotArchived.mockRejectedValue(
      new ForbiddenException('This project is archived'),
    );

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
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    prisma.stage.aggregate.mockResolvedValue({ _max: { sortOrder: 1 } });
    prisma.stage.findUnique.mockResolvedValue(stageRow('s1', 'p1'));
  });

  it('refuses a new stage, without writing', async () => {
    archived();

    await expect(
      service.create('p1', { name: 'Etap', deadline: '2026-10-31' }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.stage.create).not.toHaveBeenCalled();
  });

  it('checks the stage’s project, not the stage id', async () => {
    await service.update('s1', { name: 'Nowa nazwa' });

    expect(access.assertNotArchived).toHaveBeenCalledWith('p1');
  });

  it('checks the project when a deadline moves', async () => {
    prisma.stage.update.mockResolvedValue(stageRow('s1', 'p1'));
    prisma.stage.findMany.mockResolvedValue([]);

    await service.moveDeadline('s1', { deadline: '2026-11-30' });

    expect(access.assertNotArchived).toHaveBeenCalledWith('p1');
  });

  it('refuses archiving a stage inside an archived project', async () => {
    archived();

    await expect(service.setArchived('s1', true)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.stage.update).not.toHaveBeenCalled();
  });

  it('refuses deleting a stage, inside the transaction', async () => {
    archived();

    await expect(service.remove('s1', {})).rejects.toThrow(ForbiddenException);
    expect(access.assertNotArchived).toHaveBeenCalledWith('p1', prisma);
  });

  describe('cascade', () => {
    it('checks a single-project batch exactly once', async () => {
      prisma.stage.findMany.mockResolvedValue([
        stageRow('s1', 'p1'),
        stageRow('s2', 'p1'),
        stageRow('s3', 'p1'),
      ]);
      prisma.stage.update.mockResolvedValue(stageRow('s1', 'p1'));

      await service.applyFollowingStageShifts({
        shifts: [
          { stageId: 's1', deadline: '2026-11-30' },
          { stageId: 's2', deadline: '2026-12-15' },
          { stageId: 's3', deadline: '2026-12-31' },
        ],
      });

      expect(access.assertNotArchived).toHaveBeenCalledTimes(1);
      expect(access.assertNotArchived).toHaveBeenCalledWith('p1', prisma);
    });

    it('checks every distinct project in a mixed batch', async () => {
      prisma.stage.findMany.mockResolvedValue([
        stageRow('s1', 'p1'),
        stageRow('s2', 'p2'),
      ]);
      prisma.stage.update.mockResolvedValue(stageRow('s1', 'p1'));

      await service.applyFollowingStageShifts({
        shifts: [
          { stageId: 's1', deadline: '2026-11-30' },
          { stageId: 's2', deadline: '2026-12-15' },
        ],
      });

      expect(access.assertNotArchived).toHaveBeenCalledWith('p1', prisma);
      expect(access.assertNotArchived).toHaveBeenCalledWith('p2', prisma);
    });

    it('shifts nothing at all when one project is archived', async () => {
      prisma.stage.findMany.mockResolvedValue([
        stageRow('s1', 'p1'),
        stageRow('s2', 'p2'),
      ]);
      archived();

      await expect(
        service.applyFollowingStageShifts({
          shifts: [
            { stageId: 's1', deadline: '2026-11-30' },
            { stageId: 's2', deadline: '2026-12-15' },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.stage.update).not.toHaveBeenCalled();
    });
  });
});

describe('StagesService: a stage lives inside its project window', () => {
  let service: StagesService;

  const access = {
    assertCanRead: jest.fn(),
    assertExists: jest.fn(),
    assertNotArchived: jest.fn(),
  };

  const prisma = {
    project: { findUniqueOrThrow: jest.fn() },
    stage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const WINDOW = {
    startDate: new Date('2025-03-01'),
    plannedEndDate: new Date('2026-11-30'),
  };

  const stored = (over: Record<string, unknown> = {}) => ({
    id: 's1',
    projectId: 'p1',
    name: 'Etap',
    description: '',
    sortOrder: 1,
    startDate: null,
    deadline: new Date('2025-06-01'),
    originalDeadline: null,
    deadlineNote: null,
    completedAt: null,
    archivedAt: null,
    project: WINDOW,
    ...over,
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
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    prisma.project.findUniqueOrThrow.mockResolvedValue(WINDOW);
    prisma.stage.aggregate.mockResolvedValue({ _max: { sortOrder: 1 } });
    prisma.stage.findMany.mockResolvedValue([]);
  });

  describe('create', () => {
    it('refuses a stage that starts before the project does', async () => {
      await expect(
        service.create('p1', {
          name: 'Etap',
          startDate: '2025-01-22',
          deadline: '2025-02-22',
        }),
      ).rejects.toThrow(/przed datą startu projektu/);
      expect(prisma.stage.create).not.toHaveBeenCalled();
    });

    it('refuses a deadline past the project’s planned end', async () => {
      await expect(
        service.create('p1', { name: 'Etap', deadline: '2026-12-31' }),
      ).rejects.toThrow(/data zakończenia projektu/);
      expect(prisma.stage.create).not.toHaveBeenCalled();
    });

    it('falls back to the deadline when the stage has no start date', async () => {
      await expect(
        service.create('p1', { name: 'Etap', deadline: '2025-02-22' }),
      ).rejects.toThrow(/przed datą startu projektu/);
    });

    it('accepts a stage sitting exactly on both boundaries', async () => {
      await service.create('p1', {
        name: 'Etap',
        startDate: '2025-03-01',
        deadline: '2026-11-30',
      });

      expect(prisma.stage.create).toHaveBeenCalled();
    });

    it('applies no bound when the project has no dates', async () => {
      prisma.project.findUniqueOrThrow.mockResolvedValue({
        startDate: null,
        plannedEndDate: null,
      });

      await service.create('p1', {
        name: 'Etap',
        startDate: '2020-01-01',
        deadline: '2030-01-01',
      });

      expect(prisma.stage.create).toHaveBeenCalled();
    });
  });

  describe('moveDeadline', () => {
    it('refuses a move past the project’s planned end', async () => {
      prisma.stage.findUnique.mockResolvedValue(stored());

      await expect(
        service.moveDeadline('s1', { deadline: '2026-12-31' }),
      ).rejects.toThrow(/data zakończenia projektu/);
      expect(prisma.stage.update).not.toHaveBeenCalled();
    });

    it('allows moving the deadline TO the day the stage was completed', async () => {
      prisma.stage.findUnique.mockResolvedValue(
        stored({ completedAt: new Date('2025-06-15T14:31:00Z') }),
      );
      prisma.stage.update.mockResolvedValue(stored());

      await service.moveDeadline('s1', { deadline: '2025-06-15' });

      expect(prisma.stage.update).toHaveBeenCalled();
    });

    it('still refuses a move to the day before completion', async () => {
      prisma.stage.findUnique.mockResolvedValue(
        stored({ completedAt: new Date('2025-06-15T14:31:00Z') }),
      );

      await expect(
        service.moveDeadline('s1', { deadline: '2025-06-14' }),
      ).rejects.toThrow(/data zakończenia etapu/);
    });
  });

  describe('cascade', () => {
    it('refuses a shift landing before the stage’s own start, writing nothing', async () => {
      prisma.stage.findMany.mockResolvedValue([
        stored({ startDate: new Date('2025-05-01') }),
      ]);

      await expect(
        service.applyFollowingStageShifts({
          shifts: [{ stageId: 's1', deadline: '2025-04-01' }],
        }),
      ).rejects.toThrow(/data rozpoczęcia/);
      expect(prisma.stage.update).not.toHaveBeenCalled();
    });

    it('refuses a shift past the project’s planned end', async () => {
      prisma.stage.findMany.mockResolvedValue([stored()]);

      await expect(
        service.applyFollowingStageShifts({
          shifts: [{ stageId: 's1', deadline: '2027-01-01' }],
        }),
      ).rejects.toThrow(/data zakończenia projektu/);
      expect(prisma.stage.update).not.toHaveBeenCalled();
    });

    it('applies a shift that stays inside the window', async () => {
      prisma.stage.findMany.mockResolvedValue([stored()]);
      prisma.stage.update.mockResolvedValue(stored());

      await service.applyFollowingStageShifts({
        shifts: [{ stageId: 's1', deadline: '2025-07-01' }],
      });

      expect(prisma.stage.update).toHaveBeenCalled();
    });
  });
});
