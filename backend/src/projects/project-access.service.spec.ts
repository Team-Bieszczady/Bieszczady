import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import {
  ProjectAccessService,
  type TaskLocation,
} from './project-access.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

describe('ProjectAccessService', () => {
  let service: ProjectAccessService;

  const prisma = {
    task: { findUnique: jest.fn() },
    activity: { findUnique: jest.fn() },
    projectMember: { count: jest.fn() },
    project: { count: jest.fn(), findUnique: jest.fn() },
  };

  const user = (id: string, isDirector = false): AuthenticatedUser => ({
    id,
    email: `${id}@bieszczady.local`,
    firstName: 'Test',
    lastName: 'User',
    isDirector,
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    modules: ['TASKS'],
  });

  const task = (ownerId: string | null): TaskLocation => ({
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
        ProjectAccessService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProjectAccessService);
  });

  describe('assertCanRead', () => {
    it('lets a director read a project they are not a member of', async () => {
      prisma.project.count.mockResolvedValue(1);

      await expect(
        service.assertCanRead(user('d1', true), 'p1'),
      ).resolves.toBeUndefined();
      expect(prisma.projectMember.count).not.toHaveBeenCalled();
    });

    it('lets a member read their own project', async () => {
      prisma.project.count.mockResolvedValue(1);
      prisma.projectMember.count.mockResolvedValue(1);

      await expect(
        service.assertCanRead(user('piotr'), 'p1'),
      ).resolves.toBeUndefined();
    });

    it('hides a project the caller is not a member of', async () => {
      prisma.project.count.mockResolvedValue(1);
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(service.assertCanRead(user('tomasz'), 'p1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('answers 404 rather than 403, so a non-member cannot confirm the id exists', async () => {
      prisma.project.count.mockResolvedValue(1);
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.assertCanRead(user('tomasz'), 'p1'),
      ).rejects.not.toThrow(ForbiddenException);
    });

    it('throws for a project that does not exist, before looking at membership', async () => {
      prisma.project.count.mockResolvedValue(0);

      await expect(
        service.assertCanRead(user('d1', true), 'nope'),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.projectMember.count).not.toHaveBeenCalled();
    });
  });

  describe('assertNotArchived', () => {
    it('lets a write through on a live project', async () => {
      prisma.project.findUnique.mockResolvedValue({ archivedAt: null });

      await expect(service.assertNotArchived('p1')).resolves.toBeUndefined();
    });

    it('refuses a write on an archived project', async () => {
      prisma.project.findUnique.mockResolvedValue({
        archivedAt: new Date('2026-01-01'),
      });

      await expect(service.assertNotArchived('p1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('explains itself, rather than answering a bare "Forbidden"', async () => {
      prisma.project.findUnique.mockResolvedValue({
        archivedAt: new Date('2026-01-01'),
      });

      await expect(service.assertNotArchived('p1')).rejects.toThrow(
        /zarchiwizowany/,
      );
    });

    it('refuses a director too — archived is read-only for everyone', async () => {
      prisma.project.findUnique.mockResolvedValue({
        archivedAt: new Date('2026-01-01'),
      });

      await expect(service.assertNotArchived('p1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('404s a missing project rather than calling it archived', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.assertNotArchived('gone')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('treats a row with no archivedAt key as live, not archived', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1' });

      await expect(service.assertNotArchived('p1')).resolves.toBeUndefined();
    });

    it('reads through the client it is handed, so it joins the caller’s transaction', async () => {
      const tx = { project: { findUnique: jest.fn() } };
      tx.project.findUnique.mockResolvedValue({ archivedAt: null });

      await service.assertNotArchived('p1', tx as never);

      expect(tx.project.findUnique).toHaveBeenCalled();
      expect(prisma.project.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('locateTask', () => {
    it('reaches the project through activity -> stage, since tasks carry no project id', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1',
        activityId: 'a1',
        ownerId: 'u9',
        activity: { stageId: 's1', stage: { projectId: 'p1' } },
      });

      await expect(service.locateTask('t1')).resolves.toEqual({
        taskId: 't1',
        activityId: 'a1',
        stageId: 's1',
        projectId: 'p1',
        ownerId: 'u9',
      });
    });

    it('404s on a missing task, so a 404 really means "not there"', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.locateTask('gone')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('locateActivity', () => {
    it('404s on a missing activity', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.locateActivity('gone')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assertCanManageTasks', () => {
    it('lets a director through without querying membership', async () => {
      await expect(
        service.assertCanManageTasks(user('d1', true), 'p1'),
      ).resolves.toBeUndefined();

      expect(prisma.projectMember.count).not.toHaveBeenCalled();
    });

    it('lets the coordinator of that project through', async () => {
      prisma.projectMember.count.mockResolvedValue(1);

      await expect(
        service.assertCanManageTasks(user('anna'), 'p1'),
      ).resolves.toBeUndefined();

      expect(prisma.projectMember.count).toHaveBeenCalledWith({
        where: { projectId: 'p1', userId: 'anna', projectRole: 'COORDINATOR' },
      });
    });

    it('refuses a member who is not a coordinator', async () => {
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.assertCanManageTasks(user('piotr'), 'p1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses a coordinator of a different project', async () => {
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.assertCanManageTasks(user('tomasz'), 'p1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('explains itself, rather than answering a bare "Forbidden"', async () => {
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.assertCanManageTasks(user('piotr'), 'p1'),
      ).rejects.toThrow(/dyrektor lub koordynator tego projektu/);
    });
  });

  describe('assertCanChangeTaskStatus', () => {
    it('lets the owner tick their own task without any membership lookup', async () => {
      await expect(
        service.assertCanChangeTaskStatus(user('piotr'), task('piotr')),
      ).resolves.toBeUndefined();

      expect(prisma.projectMember.count).not.toHaveBeenCalled();
    });

    it('lets a director tick a task they do not own', async () => {
      await expect(
        service.assertCanChangeTaskStatus(user('d1', true), task('piotr')),
      ).resolves.toBeUndefined();
    });

    it('lets the project coordinator tick a task they do not own', async () => {
      prisma.projectMember.count.mockResolvedValue(1);

      await expect(
        service.assertCanChangeTaskStatus(user('anna'), task('piotr')),
      ).resolves.toBeUndefined();
    });

    it("refuses an executor on someone else's task", async () => {
      prisma.projectMember.count.mockResolvedValue(0);

      await expect(
        service.assertCanChangeTaskStatus(user('ewa'), task('piotr')),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assertOwnsTask', () => {
    it('lets the owner manage their own checklist', () => {
      expect(() =>
        service.assertOwnsTask(user('piotr'), task('piotr')),
      ).not.toThrow();
    });

    it('refuses a director who does not own the task', () => {
      expect(() =>
        service.assertOwnsTask(user('d1', true), task('piotr')),
      ).toThrow(ForbiddenException);
    });

    it('refuses everyone on an unowned task', () => {
      expect(() =>
        service.assertOwnsTask(user('d1', true), task(null)),
      ).toThrow(ForbiddenException);
      expect(() => service.assertOwnsTask(user('anna'), task(null))).toThrow(
        ForbiddenException,
      );
    });
  });
});
