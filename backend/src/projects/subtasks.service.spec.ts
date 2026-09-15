import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from './project-access.service';
import { SubtasksService } from './subtasks.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

describe('SubtasksService', () => {
  let service: SubtasksService;

  const prisma = {
    project: { findUnique: jest.fn() },
    task: { count: jest.fn(), update: jest.fn() },
    subtask: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const owner = { id: 'piotr', isDirector: false } as AuthenticatedUser;
  const director = { id: 'd1', isDirector: true } as AuthenticatedUser;

  const access = new ProjectAccessService(prisma as never);
  const location = (ownerId: string | null) => ({
    taskId: 't1',
    activityId: 'a1',
    stageId: 's1',
    projectId: 'p1',
    ownerId,
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubtasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(SubtasksService);
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => unknown) => fn(prisma),
    );
    jest.spyOn(access, 'locateTask').mockResolvedValue(location('piotr'));
    prisma.project.findUnique.mockResolvedValue({ archivedAt: null });
    prisma.subtask.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    prisma.subtask.create.mockResolvedValue({ id: 'st3' });
  });

  describe('create', () => {
    it('lets the owner add a checklist item', async () => {
      await service.create('t1', { title: 'Zebrać oferty' }, owner);

      expect(prisma.subtask.create).toHaveBeenCalledWith({
        data: { taskId: 't1', title: 'Zebrać oferty', sortOrder: 3 },
      });
    });

    it('refuses a director who does not own the task', async () => {
      await expect(
        service.create('t1', { title: 'Zebrać oferty' }, director),
      ).rejects.toThrow(ForbiddenException);

      expect(prisma.subtask.create).not.toHaveBeenCalled();
    });

    it('refuses everyone once the task has no owner', async () => {
      jest.spyOn(access, 'locateTask').mockResolvedValue(location(null));

      await expect(
        service.create('t1', { title: 'Krok' }, owner),
      ).rejects.toThrow(ForbiddenException);
    });

    it('numbers a first item 1', async () => {
      prisma.subtask.aggregate.mockResolvedValue({ _max: { sortOrder: null } });

      await service.create('t1', { title: 'Krok' }, owner);

      expect(prisma.subtask.create).toHaveBeenCalledWith({
        data: { taskId: 't1', title: 'Krok', sortOrder: 1 },
      });
    });

    it('assigns sortOrder inside a transaction, so two adds cannot collide', async () => {
      await service.create('t1', { title: 'Krok' }, owner);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.subtask.findUnique.mockResolvedValue({ id: 'st1', taskId: 't1' });
    });

    it('ticks an item for its owner', async () => {
      await service.update('st1', { done: true }, owner);

      expect(prisma.subtask.update).toHaveBeenCalledWith({
        where: { id: 'st1' },
        data: { done: true },
      });
    });

    it('renames without touching done', async () => {
      await service.update('st1', { title: 'Nowy krok' }, owner);

      expect(prisma.subtask.update).toHaveBeenCalledWith({
        where: { id: 'st1' },
        data: { title: 'Nowy krok' },
      });
    });

    it('refuses a non-owning director', async () => {
      await expect(
        service.update('st1', { done: true }, director),
      ).rejects.toThrow(ForbiddenException);
    });

    it('404s on a missing subtask before authorising', async () => {
      prisma.subtask.findUnique.mockResolvedValue(null);

      await expect(
        service.update('gone', { done: true }, owner),
      ).rejects.toThrow(NotFoundException);
    });

    it('never writes to the parent task', async () => {
      await service.update('st1', { done: true }, owner);

      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      prisma.subtask.findUnique.mockResolvedValue({ id: 'st1', taskId: 't1' });
    });

    it('deletes for the owner', async () => {
      await service.remove('st1', owner);

      expect(prisma.subtask.delete).toHaveBeenCalledWith({
        where: { id: 'st1' },
      });
    });

    it('refuses a non-owning director', async () => {
      await expect(service.remove('st1', director)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('leaves a hole in sortOrder rather than renumbering', async () => {
      await service.remove('st1', owner);

      expect(prisma.subtask.update).not.toHaveBeenCalled();
    });
  });

  describe('an archived project is read-only', () => {
    beforeEach(() => {
      prisma.project.findUnique.mockResolvedValue({
        archivedAt: new Date('2026-01-01'),
      });
    });

    it('refuses a new checklist item from its owner', async () => {
      await expect(
        service.create('t1', { title: 'Zebrać oferty' }, owner),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.subtask.create).not.toHaveBeenCalled();
    });

    it('refuses ticking an item', async () => {
      prisma.subtask.findUnique.mockResolvedValue({ id: 'st1', taskId: 't1' });

      await expect(
        service.update('st1', { done: true }, owner),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.subtask.update).not.toHaveBeenCalled();
    });

    it('refuses deleting an item', async () => {
      prisma.subtask.findUnique.mockResolvedValue({ id: 'st1', taskId: 't1' });

      await expect(service.remove('st1', owner)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.subtask.delete).not.toHaveBeenCalled();
    });

    it('still answers "not your task" first for a non-owning director', async () => {
      await expect(
        service.create('t1', { title: 'Zebrać oferty' }, director),
      ).rejects.toThrow(/przypisano zadanie/);
    });
  });
});
