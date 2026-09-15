import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { StageCompletionService } from './stage-completion.service';
import { ProjectAccessService } from './project-access.service';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService', () => {
  let service: ActivitiesService;

  const settle = jest.fn();
  const access = {
    locateActivity: jest.fn(),
    assertNotArchived: jest.fn(),
  };

  const prisma = {
    stage: { findUnique: jest.fn() },
    activity: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: { deleteMany: jest.fn() },
    subtask: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };

  const archived = () =>
    access.assertNotArchived.mockRejectedValue(
      new ForbiddenException('This project is archived'),
    );

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: StageCompletionService, useValue: { settle } },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(ActivitiesService);
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    prisma.activity.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    access.locateActivity.mockResolvedValue({
      stageId: 's1',
      projectId: 'p1',
    });
  });

  describe('create', () => {
    it('checks the stage’s project before writing', async () => {
      prisma.stage.findUnique.mockResolvedValue({ id: 's1', projectId: 'p1' });

      await service.create('s1', { name: 'Działanie' });

      expect(access.assertNotArchived).toHaveBeenCalledWith('p1');
      expect(prisma.activity.create).toHaveBeenCalled();
    });

    it('404s a missing stage before reaching the archived check', async () => {
      prisma.stage.findUnique.mockResolvedValue(null);

      await expect(
        service.create('gone', { name: 'Działanie' }),
      ).rejects.toThrow(NotFoundException);
      expect(access.assertNotArchived).not.toHaveBeenCalled();
    });

    it('refuses on an archived project, without writing', async () => {
      prisma.stage.findUnique.mockResolvedValue({ id: 's1', projectId: 'p1' });
      archived();

      await expect(service.create('s1', { name: 'Działanie' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.activity.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('locates the project through the activity, which carries only a stage id', async () => {
      await service.update('a1', { name: 'Nowa nazwa' });

      expect(access.locateActivity).toHaveBeenCalledWith('a1');
      expect(access.assertNotArchived).toHaveBeenCalledWith('p1');
    });

    it('refuses on an archived project, without writing', async () => {
      archived();

      await expect(service.update('a1', { name: 'Nowa' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.activity.update).not.toHaveBeenCalled();
    });
  });

  describe('move', () => {
    it('checks one project when both ends share it', async () => {
      prisma.stage.findUnique.mockResolvedValue({ id: 's2', projectId: 'p1' });
      prisma.activity.update.mockResolvedValue({ id: 'a1', stageId: 's2' });

      await service.move('a1', { stageId: 's2' });

      expect(access.assertNotArchived).toHaveBeenCalledTimes(1);
      expect(access.assertNotArchived).toHaveBeenCalledWith('p1', prisma);
      expect(settle).toHaveBeenCalledWith(prisma, ['s1', 's2']);
    });

    it('checks both ends when the target sits in another project', async () => {
      prisma.stage.findUnique.mockResolvedValue({ id: 's9', projectId: 'p2' });
      prisma.activity.update.mockResolvedValue({ id: 'a1', stageId: 's9' });

      await service.move('a1', { stageId: 's9' });

      expect(access.assertNotArchived).toHaveBeenCalledWith('p1', prisma);
      expect(access.assertNotArchived).toHaveBeenCalledWith('p2', prisma);
    });

    it('refuses when the destination project is archived', async () => {
      prisma.stage.findUnique.mockResolvedValue({ id: 's9', projectId: 'p2' });
      access.assertNotArchived
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new ForbiddenException('archived'));

      await expect(service.move('a1', { stageId: 's9' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.activity.update).not.toHaveBeenCalled();
    });

    it('404s a missing target stage', async () => {
      prisma.stage.findUnique.mockResolvedValue(null);

      await expect(service.move('a1', { stageId: 'gone' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the row unchanged when the target is the stage it already sits in', async () => {
      prisma.stage.findUnique.mockResolvedValue({ id: 's1', projectId: 'p1' });
      prisma.activity.findUniqueOrThrow.mockResolvedValue({
        id: 'a1',
        stageId: 's1',
        name: 'Działanie',
      });

      const result = await service.move('a1', { stageId: 's1' });

      expect(result).toEqual({ id: 'a1', stageId: 's1', name: 'Działanie' });
      expect(prisma.activity.update).not.toHaveBeenCalled();
      expect(settle).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes subtasks before tasks before the activity, then settles its stage', async () => {
      const order: string[] = [];
      prisma.subtask.deleteMany.mockImplementation(() => {
        order.push('subtasks');
        return {};
      });
      prisma.task.deleteMany.mockImplementation(() => {
        order.push('tasks');
        return {};
      });
      prisma.activity.delete.mockImplementation(() => {
        order.push('activity');
        return {};
      });

      await service.remove('a1');

      expect(order).toEqual(['subtasks', 'tasks', 'activity']);
      expect(settle).toHaveBeenCalledWith(prisma, ['s1']);
    });

    it('refuses on an archived project, deleting nothing', async () => {
      archived();

      await expect(service.remove('a1')).rejects.toThrow(ForbiddenException);
      expect(prisma.subtask.deleteMany).not.toHaveBeenCalled();
      expect(prisma.activity.delete).not.toHaveBeenCalled();
    });
  });
});
