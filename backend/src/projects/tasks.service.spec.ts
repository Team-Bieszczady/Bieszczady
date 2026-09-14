import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StageCompletionService } from './stage-completion.service';
import { ProjectAccessService } from './project-access.service';
import { TasksService } from './tasks.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

describe('TasksService', () => {
  let service: TasksService;

  const prisma = {
    project: { count: jest.fn() },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subtask: { deleteMany: jest.fn() },
    projectMember: { count: jest.fn() },
    $transaction: jest.fn(),
  };

  const settle = jest.fn();
  const access = {
    assertCanRead: jest.fn(),
    locateTask: jest.fn(),
    locateActivity: jest.fn(),
    assertCanManageTasks: jest.fn(),
    assertCanChangeTaskStatus: jest.fn(),
    assertOwnsTask: jest.fn(),
  };

  const director = { id: 'd1', isDirector: true } as AuthenticatedUser;

  const row = (stageId: string, subtasks: { done: boolean }[] = []) => ({
    id: 't1',
    activityId: 'a1',
    title: 'Zadanie',
    description: '',
    status: 'NEW',
    priority: 'MEDIUM',
    dueDate: null,
    owner: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    subtasks: subtasks.map((subtask, index) => ({
      id: `st${index}`,
      title: `Krok ${index}`,
      done: subtask.done,
      sortOrder: index + 1,
    })),
    activity: {
      id: 'a1',
      name: 'Działanie',
      stage: {
        id: stageId,
        name: 'Etap',
        deadline: new Date('2026-10-31'),
        archivedAt: null,
        projectId: 'p1',
      },
    },
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: StageCompletionService, useValue: { settle } },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(TasksService);
    prisma.project.count.mockResolvedValue(1);
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    access.locateTask.mockResolvedValue({
      taskId: 't1',
      activityId: 'a1',
      stageId: 's1',
      projectId: 'p1',
      ownerId: 'piotr',
    });
  });

  describe('reads', () => {
    it('hides tasks under archived stages by default', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAllForProject('p1', director);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activity: { stage: { projectId: 'p1', archivedAt: null } } },
        }),
      );
    });

    it('includes them when asked', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAllForProject('p1', director, true);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activity: { stage: { projectId: 'p1' } } },
        }),
      );
    });

    it('scopes "my tasks" to the caller', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findMineForProject('p1', {
        id: 'piotr',
        isDirector: false,
      } as AuthenticatedUser);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ownerId: 'piotr' }) as object,
        }),
      );
    });

    it('folds subtask progress from the rows it already holds', async () => {
      prisma.task.findMany.mockResolvedValue([
        row('s1', [{ done: true }, { done: false }]),
      ]);

      const [result] = await service.findAllForProject('p1', director);

      expect(result.subtaskProgress).toEqual({
        done: 1,
        total: 2,
        percent: 50,
      });
    });

    it('reports 0% rather than NaN for a task with no subtasks', async () => {
      prisma.task.findMany.mockResolvedValue([row('s1', [])]);

      const [result] = await service.findAllForProject('p1', director);

      expect(result.subtaskProgress).toEqual({ done: 0, total: 0, percent: 0 });
    });
  });

  describe('create', () => {
    beforeEach(() => {
      access.locateActivity.mockResolvedValue({
        stageId: 's1',
        projectId: 'p1',
      });
      prisma.task.create.mockResolvedValue(row('s1'));
    });

    it('settles the stage, so a task added to a finished stage reopens it', async () => {
      await service.create('a1', { title: 'Zadanie' }, director);

      expect(settle).toHaveBeenCalledWith(prisma, ['s1']);
    });

    it('refuses an owner who is not a member of the project', async () => {
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.create(
          'a1',
          { title: 'Zadanie', ownerId: 'outsider' },
          director,
        ),
      ).rejects.toThrow(ConflictException);

      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('accepts an unassigned task', async () => {
      await service.create('a1', { title: 'Zadanie', ownerId: null }, director);

      expect(prisma.projectMember.count).not.toHaveBeenCalled();
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('settles both stages when a task is re-filed across stages', async () => {
      access.locateActivity.mockResolvedValue({
        stageId: 's2',
        projectId: 'p1',
      });
      prisma.task.update.mockResolvedValue(row('s2'));

      await service.update('t1', { activityId: 'a2' }, director);

      expect(settle).toHaveBeenCalledWith(prisma, ['s1', 's2']);
    });

    it('does not settle when only the title changes', async () => {
      prisma.task.update.mockResolvedValue(row('s1'));

      await service.update('t1', { title: 'Nowa nazwa' }, director);

      expect(settle).not.toHaveBeenCalled();
    });

    it('refuses a re-file into another project', async () => {
      access.locateActivity.mockResolvedValue({
        stageId: 's9',
        projectId: 'p2',
      });

      await expect(
        service.update('t1', { activityId: 'a9' }, director),
      ).rejects.toThrow(ConflictException);
    });

    it('leaves an existing non-member owner alone when ownerId is not sent', async () => {
      prisma.task.update.mockResolvedValue(row('s1'));

      await service.update('t1', { title: 'Nowa nazwa' }, director);

      expect(prisma.projectMember.count).not.toHaveBeenCalled();
    });

    it('checks membership when ownerId is sent', async () => {
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.update('t1', { ownerId: 'outsider' }, director),
      ).rejects.toThrow(ConflictException);
    });

    it('clears the owner with an explicit null', async () => {
      prisma.task.update.mockResolvedValue(row('s1'));

      await service.update('t1', { ownerId: null }, director);

      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            owner: { disconnect: true },
          }) as object,
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('settles the stage — the only way a stage closes through the API', async () => {
      prisma.task.update.mockResolvedValue(row('s1'));

      await service.updateStatus('t1', { status: 'DONE' }, director);

      expect(settle).toHaveBeenCalledWith(prisma, ['s1']);
    });

    it('settles on reopen too', async () => {
      prisma.task.update.mockResolvedValue(row('s1'));

      await service.updateStatus('t1', { status: 'NEW' }, director);

      expect(settle).toHaveBeenCalledWith(prisma, ['s1']);
    });

    it('authorises through the wider status rule, not the manage rule', async () => {
      prisma.task.update.mockResolvedValue(row('s1'));

      await service.updateStatus('t1', { status: 'DONE' }, director);

      expect(access.assertCanChangeTaskStatus).toHaveBeenCalled();
      expect(access.assertCanManageTasks).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the checklist before the task, then settles', async () => {
      const order: string[] = [];
      prisma.subtask.deleteMany.mockImplementation(() => {
        order.push('subtasks');
        return Promise.resolve({ count: 2 });
      });
      prisma.task.delete.mockImplementation(() => {
        order.push('task');
        return Promise.resolve(row('s1'));
      });

      await service.remove('t1', director);

      expect(order).toEqual(['subtasks', 'task']);
      expect(settle).toHaveBeenCalledWith(prisma, ['s1']);
    });
  });
});
