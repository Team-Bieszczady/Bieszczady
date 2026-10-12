import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from './project-access.service';
import {
  IndicatorsService,
  indicatorDeadline,
  indicatorPercent,
} from './indicators.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

const STAGE_END = new Date('2026-08-06');
const TASK_DUE = new Date('2026-07-20');
const PROJECT_END = new Date('2026-12-31');

const stage = { id: 's1', name: 'Warsztaty terenowe', deadline: STAGE_END };
const task = (dueDate: Date | null) => ({
  id: 't1',
  title: 'Warsztat w Lesku',
  dueDate,
  activity: { stage },
});

describe('indicator percent', () => {
  it('is 0 at zero', () => {
    expect(indicatorPercent(0, 5)).toBe(0);
  });

  it('is the share of the target in between', () => {
    expect(indicatorPercent(3, 5)).toBe(60);
  });

  it('never passes 100', () => {
    expect(indicatorPercent(6, 5)).toBe(100);
  });
});

describe('indicator deadline is derived, never stored', () => {
  const project = { plannedEndDate: PROJECT_END };

  it('ends with its stage', () => {
    expect(
      indicatorDeadline({ scope: 'STAGE', stage, task: null, project }),
    ).toEqual({
      deadline: STAGE_END,
      deadlineSource: 'koniec etapu „Warsztaty terenowe”',
    });
  });

  it('ends with its task when the task has a due date', () => {
    expect(
      indicatorDeadline({
        scope: 'STAGE',
        stage: null,
        task: task(TASK_DUE),
        project,
      }),
    ).toEqual({
      deadline: TASK_DUE,
      deadlineSource: 'koniec zadania „Warsztat w Lesku”',
    });
  });

  it('falls back to the stage of a task without a due date', () => {
    expect(
      indicatorDeadline({
        scope: 'STAGE',
        stage: null,
        task: task(null),
        project,
      }),
    ).toEqual({
      deadline: STAGE_END,
      deadlineSource: 'koniec etapu „Warsztaty terenowe”',
    });
  });

  it('ends with the project when it is project-wide', () => {
    expect(
      indicatorDeadline({ scope: 'PROJECT', stage: null, task: null, project }),
    ).toEqual({ deadline: PROJECT_END, deadlineSource: 'koniec projektu' });
  });

  it('has no deadline when the project has no planned end', () => {
    expect(
      indicatorDeadline({
        scope: 'PROJECT',
        stage: null,
        task: null,
        project: { plannedEndDate: null },
      }).deadline,
    ).toBeNull();
  });

  it('follows a moved stage, because it reads the stage every time', () => {
    const moved = { ...stage, deadline: new Date('2026-09-15') };
    expect(
      indicatorDeadline({
        scope: 'STAGE',
        stage: moved,
        task: null,
        project,
      }).deadline,
    ).toEqual(new Date('2026-09-15'));
  });
});

describe('IndicatorsService', () => {
  let service: IndicatorsService;

  const prisma = {
    indicator: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn<
        Promise<unknown>,
        [{ data: Prisma.IndicatorUncheckedCreateInput }]
      >(),
      update: jest.fn<
        Promise<unknown>,
        [{ where: { id: string }; data: Prisma.IndicatorUncheckedUpdateInput }]
      >(),
      delete: jest.fn(),
    },
    indicatorFolder: { deleteMany: jest.fn(), createMany: jest.fn() },
    folder: { findMany: jest.fn(), count: jest.fn() },
    documentAccess: { findMany: jest.fn() },
    document: { findMany: jest.fn() },
    stage: { findUnique: jest.fn() },
    projectMember: { count: jest.fn() },
    $transaction: jest.fn(),
  };

  const access = {
    assertCanRead: jest.fn(),
    assertCanManageIndicators: jest.fn(),
    assertNotArchived: jest.fn(),
    locateTask: jest.fn(),
    canManageTasks: jest.fn(),
  };

  const coordinator = {
    id: 'anna',
    isDirector: false,
    modules: [],
  } as unknown as AuthenticatedUser;
  const member = (modules: string[]) =>
    ({ id: 'jan', isDirector: false, modules }) as unknown as AuthenticatedUser;

  const stored = (overrides: Record<string, unknown> = {}) => ({
    id: 'i1',
    projectId: 'p1',
    name: 'Liczba przeprowadzonych warsztatów',
    description: '',
    targetValue: 5,
    currentValue: 3,
    scope: 'STAGE',
    stageId: 's1',
    taskId: null,
    ownerId: null,
    createdAt: new Date('2026-10-01'),
    updatedAt: new Date('2026-10-01'),
    ...overrides,
  });

  const withIncludes = (overrides: Record<string, unknown> = {}) => ({
    ...stored(overrides),
    owner: null,
    stage,
    task: null,
    folders: [{ folderId: 'f-lists' }, { folderId: 'f-photos' }],
    project: { plannedEndDate: PROJECT_END },
  });

  const base = {
    name: 'Liczba przeprowadzonych warsztatów',
    targetValue: 5,
    scope: 'STAGE' as const,
    stageId: 's1',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndicatorsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(IndicatorsService);
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    access.canManageTasks.mockImplementation(
      (viewer: AuthenticatedUser) => viewer === coordinator,
    );
    prisma.stage.findUnique.mockResolvedValue({ projectId: 'p1' });
    prisma.folder.count.mockResolvedValue(2);
    prisma.folder.findMany.mockResolvedValue([
      { id: 'root', name: 'Wskaźniki', parentId: null },
      { id: 'f-lists', name: 'Listy obecności', parentId: 'root' },
      { id: 'f-photos', name: 'Zdjęcia', parentId: 'root' },
    ]);
    prisma.indicator.create.mockResolvedValue(stored());
    prisma.indicator.findUnique.mockResolvedValue(stored());
    prisma.indicator.findUniqueOrThrow.mockResolvedValue(withIncludes());
  });

  describe('reads', () => {
    it('checks read access and returns the computed fields with folder paths', async () => {
      prisma.indicator.findMany.mockResolvedValue([withIncludes()]);

      const [indicator] = await service.findAllForProject('p1', coordinator);

      expect(access.assertCanRead).toHaveBeenCalledWith(coordinator, 'p1');
      expect(indicator).not.toHaveProperty('status');
      expect(indicator).toMatchObject({
        percent: 60,
        deadline: STAGE_END,
        deadlineSource: 'koniec etapu „Warsztaty terenowe”',
        stage: { id: 's1', name: 'Warsztaty terenowe' },
        folders: [
          { id: 'f-lists', name: 'Listy obecności', path: 'Wskaźniki' },
          { id: 'f-photos', name: 'Zdjęcia', path: 'Wskaźniki' },
        ],
      });
    });

    it('drops a folder that has since been deleted', async () => {
      prisma.indicator.findMany.mockResolvedValue([withIncludes()]);
      prisma.folder.findMany.mockResolvedValue([
        { id: 'f-lists', name: 'Listy obecności', parentId: null },
      ]);

      const [indicator] = await service.findAllForProject('p1', coordinator);

      expect(indicator.folders).toEqual([
        { id: 'f-lists', name: 'Listy obecności', path: '' },
      ]);
    });

    it('hides folders from a member without the Dokumenty module', async () => {
      prisma.indicator.findMany.mockResolvedValue([withIncludes()]);

      const [indicator] = await service.findAllForProject('p1', member([]));

      expect(indicator.folders).toEqual([]);
      expect(prisma.folder.findMany).not.toHaveBeenCalled();
    });

    it('shows a member with Dokumenty every folder under a shared parent', async () => {
      prisma.indicator.findMany.mockResolvedValue([withIncludes()]);
      prisma.documentAccess.findMany.mockResolvedValue([
        { folderId: 'root', documentId: null },
      ]);

      const [indicator] = await service.findAllForProject(
        'p1',
        member(['DOCUMENTS']),
      );

      expect(indicator.folders).toEqual([
        { id: 'f-lists', name: 'Listy obecności', path: 'Wskaźniki' },
        { id: 'f-photos', name: 'Zdjęcia', path: 'Wskaźniki' },
      ]);
    });

    it('shows a member with Dokumenty only the folders shared with them, without hidden parents in the path', async () => {
      prisma.indicator.findMany.mockResolvedValue([withIncludes()]);
      prisma.documentAccess.findMany.mockResolvedValue([
        { folderId: 'f-lists', documentId: null },
      ]);

      const [indicator] = await service.findAllForProject(
        'p1',
        member(['DOCUMENTS']),
      );

      expect(indicator.folders).toEqual([
        { id: 'f-lists', name: 'Listy obecności', path: '' },
      ]);
    });

    it('shows a member with Dokumenty the folder holding a document shared with them', async () => {
      prisma.indicator.findMany.mockResolvedValue([withIncludes()]);
      prisma.documentAccess.findMany.mockResolvedValue([
        { folderId: null, documentId: 'd1' },
      ]);
      prisma.document.findMany.mockResolvedValue([{ folderId: 'f-photos' }]);

      const [indicator] = await service.findAllForProject(
        'p1',
        member(['DOCUMENTS']),
      );

      expect(indicator.folders).toEqual([
        { id: 'f-photos', name: 'Zdjęcia', path: '' },
      ]);
    });

    it('shows a member with Dokumenty nothing when no folder is shared with them', async () => {
      prisma.indicator.findMany.mockResolvedValue([withIncludes()]);
      prisma.documentAccess.findMany.mockResolvedValue([]);

      const [indicator] = await service.findAllForProject(
        'p1',
        member(['DOCUMENTS']),
      );

      expect(indicator.folders).toEqual([]);
      expect(prisma.document.findMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('stores the indicator with its folders and no deadline column', async () => {
      await service.create(
        'p1',
        { ...base, folderIds: ['f-lists', 'f-photos'] },
        coordinator,
      );

      const { data } = prisma.indicator.create.mock.calls[0][0];
      expect(data).toEqual({
        projectId: 'p1',
        name: base.name,
        description: '',
        targetValue: 5,
        currentValue: 0,
        scope: 'STAGE',
        stageId: 's1',
        taskId: null,
        ownerId: null,
        folders: {
          create: [{ folderId: 'f-lists' }, { folderId: 'f-photos' }],
        },
      });
    });

    it('clears any stage or task for a project-wide indicator', async () => {
      await service.create(
        'p1',
        { ...base, scope: 'PROJECT', stageId: 's1' },
        coordinator,
      );

      const { data } = prisma.indicator.create.mock.calls[0][0];
      expect(data).toMatchObject({
        scope: 'PROJECT',
        stageId: null,
        taskId: null,
      });
    });

    it('refuses someone who is neither director nor coordinator, writing nothing', async () => {
      access.assertCanManageIndicators.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(service.create('p1', base, coordinator)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.indicator.create).not.toHaveBeenCalled();
    });

    it('refuses on an archived project', async () => {
      access.assertNotArchived.mockRejectedValue(new ForbiddenException());

      await expect(service.create('p1', base, coordinator)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.indicator.create).not.toHaveBeenCalled();
    });

    it('requires a stage or a task when scope is STAGE', async () => {
      await expect(
        service.create('p1', { ...base, stageId: undefined }, coordinator),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses both a stage and a task at once', async () => {
      await expect(
        service.create('p1', { ...base, taskId: 't1' }, coordinator),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses a stage from another project', async () => {
      prisma.stage.findUnique.mockResolvedValue({ projectId: 'p2' });

      await expect(service.create('p1', base, coordinator)).rejects.toThrow(
        ConflictException,
      );
    });

    it('refuses a stage that does not exist', async () => {
      prisma.stage.findUnique.mockResolvedValue(null);

      await expect(service.create('p1', base, coordinator)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses a task from another project', async () => {
      access.locateTask.mockResolvedValue({ taskId: 't1', projectId: 'p2' });

      await expect(
        service.create(
          'p1',
          { ...base, stageId: undefined, taskId: 't1' },
          coordinator,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('accepts a task of this project', async () => {
      access.locateTask.mockResolvedValue({ taskId: 't1', projectId: 'p1' });

      await service.create(
        'p1',
        { ...base, stageId: undefined, taskId: 't1' },
        coordinator,
      );

      expect(prisma.indicator.create.mock.calls[0][0].data).toMatchObject({
        stageId: null,
        taskId: 't1',
      });
    });

    it('refuses a folder outside this project, or deleted', async () => {
      prisma.folder.count.mockResolvedValue(1);

      await expect(
        service.create(
          'p1',
          { ...base, folderIds: ['f-lists', 'f-other'] },
          coordinator,
        ),
      ).rejects.toThrow(ConflictException);
      expect(prisma.folder.count).toHaveBeenCalledWith({
        where: {
          id: { in: ['f-lists', 'f-other'] },
          projectId: 'p1',
          deletedAt: null,
        },
      });
    });

    it('refuses a current value above the target', async () => {
      await expect(
        service.create('p1', { ...base, currentValue: 6 }, coordinator),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses an owner who is not a member of the project', async () => {
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.create('p1', { ...base, ownerId: 'obcy' }, coordinator),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('switching to the whole project unlinks the stage', async () => {
      await service.update('i1', { scope: 'PROJECT' }, coordinator);

      expect(prisma.indicator.update).toHaveBeenCalledWith({
        where: { id: 'i1' },
        data: { scope: 'PROJECT', stageId: null, taskId: null },
      });
    });

    it('replaces the folder set', async () => {
      prisma.folder.count.mockResolvedValue(1);

      await service.update('i1', { folderIds: ['f-photos'] }, coordinator);

      expect(prisma.indicatorFolder.deleteMany).toHaveBeenCalledWith({
        where: { indicatorId: 'i1' },
      });
      expect(prisma.indicatorFolder.createMany).toHaveBeenCalledWith({
        data: [{ indicatorId: 'i1', folderId: 'f-photos' }],
      });
    });

    it('refuses lowering the target below what is already done', async () => {
      await expect(
        service.update('i1', { targetValue: 2 }, coordinator),
      ).rejects.toThrow(ConflictException);
    });

    it('is a 404 for an unknown indicator', async () => {
      prisma.indicator.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nope', { name: 'X' }, coordinator),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('progress', () => {
    const savedValue = () =>
      prisma.indicator.update.mock.calls[0][0].data.currentValue;

    it('steps up by one', async () => {
      await service.updateProgress('i1', { delta: 1 }, coordinator);
      expect(savedValue()).toBe(4);
    });

    it('never goes above the target', async () => {
      prisma.indicator.findUnique.mockResolvedValue(
        stored({ currentValue: 5 }),
      );

      await service.updateProgress('i1', { delta: 1 }, coordinator);
      expect(savedValue()).toBe(5);
    });

    it('never goes below zero', async () => {
      prisma.indicator.findUnique.mockResolvedValue(
        stored({ currentValue: 0 }),
      );

      await service.updateProgress('i1', { delta: -1 }, coordinator);
      expect(savedValue()).toBe(0);
    });

    it('clamps an explicit value to the target', async () => {
      await service.updateProgress('i1', { value: 99 }, coordinator);
      expect(savedValue()).toBe(5);
    });

    it('wants exactly one of delta and value', async () => {
      await expect(
        service.updateProgress('i1', {}, coordinator),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateProgress('i1', { delta: 1, value: 2 }, coordinator),
      ).rejects.toThrow(BadRequestException);
    });

    it('is refused for someone who cannot manage indicators', async () => {
      access.assertCanManageIndicators.mockRejectedValue(
        new ForbiddenException(),
      );

      await expect(
        service.updateProgress('i1', { delta: 1 }, coordinator),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.indicator.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the folder links before the indicator', async () => {
      await service.remove('i1', coordinator);

      expect(
        prisma.indicatorFolder.deleteMany.mock.invocationCallOrder[0],
      ).toBeLessThan(prisma.indicator.delete.mock.invocationCallOrder[0]);
    });
  });
});
