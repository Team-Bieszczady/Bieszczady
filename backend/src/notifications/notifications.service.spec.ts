import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const prisma = {
    task: { findMany: jest.fn() },
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const oleg = { id: 'oleg', isDirector: false } as AuthenticatedUser;

  const task = (id: string, dueDate: string) => ({
    id,
    dueDate: new Date(`${dueDate}T00:00:00.000Z`),
  });

  const createdData = () =>
    prisma.notification.create.mock.calls.map(
      ([args]: [Prisma.NotificationCreateArgs]) =>
        args.data as Prisma.NotificationUncheckedCreateInput,
    );

  beforeEach(async () => {
    jest.resetAllMocks();
    jest.useFakeTimers({ now: new Date('2026-09-30T10:00:00.000Z') });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(NotificationsService);
    prisma.task.findMany.mockResolvedValue([]);
    prisma.notification.findMany.mockResolvedValue([]);
    prisma.notification.count.mockResolvedValue(0);
  });

  afterEach(() => jest.useRealTimers());

  describe('deadline sweep', () => {
    it('looks only at the viewer’s own open tasks due by tomorrow', async () => {
      await service.findMine(oleg);

      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ownerId: 'oleg',
            status: { not: 'DONE' },
            dueDate: { lte: new Date('2026-10-01T00:00:00.000Z') },
            activity: { stage: { project: { archivedAt: null } } },
          },
        }),
      );
    });

    it('reminds the day before, and flags a missed deadline', async () => {
      prisma.task.findMany.mockResolvedValue([
        task('t1', '2026-10-01'),
        task('t2', '2026-08-08'),
      ]);

      await service.findMine(oleg);

      expect(createdData()).toEqual([
        {
          userId: 'oleg',
          taskId: 't1',
          kind: 'TASK_DUE_SOON',
          dedupeKey: 'due-soon:t1:2026-10-01',
          createdAt: new Date('2026-09-30T00:00:00.000Z'),
        },
        {
          userId: 'oleg',
          taskId: 't2',
          kind: 'TASK_OVERDUE',
          dedupeKey: 'overdue:t2:2026-08-08',
          createdAt: new Date('2026-08-09T00:00:00.000Z'),
        },
      ]);
    });

    it('says nothing on the deadline day itself', async () => {
      prisma.task.findMany.mockResolvedValue([task('t1', '2026-09-30')]);

      await service.findMine(oleg);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('skips a notice an earlier open already recorded', async () => {
      prisma.task.findMany.mockResolvedValue([task('t2', '2026-08-08')]);
      prisma.notification.findMany
        .mockResolvedValueOnce([{ dedupeKey: 'overdue:t2:2026-08-08' }])
        .mockResolvedValue([]);

      await service.findMine(oleg);

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });

    it('swallows a duplicate written concurrently, and nothing else', async () => {
      prisma.task.findMany.mockResolvedValue([task('t2', '2026-08-08')]);
      prisma.notification.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.findMine(oleg)).resolves.toBeDefined();

      prisma.notification.create.mockRejectedValueOnce(new Error('boom'));
      await expect(service.findMine(oleg)).rejects.toThrow('boom');
    });
  });

  describe('listing', () => {
    it('scopes to the viewer, their projects, and deadline notices of tasks they still own and have not finished', async () => {
      await service.findMine(oleg);

      const calls = prisma.notification.findMany.mock.calls as [
        Prisma.NotificationFindManyArgs,
      ][];
      const { where } = calls[calls.length - 1][0];
      expect(where).toEqual({
        userId: 'oleg',
        task: {
          activity: {
            stage: {
              project: {
                archivedAt: null,
                members: { some: { userId: 'oleg' } },
              },
            },
          },
        },
        OR: [
          { kind: 'TASK_ASSIGNED' },
          { task: { ownerId: 'oleg', status: { not: 'DONE' } } },
        ],
      });
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { ...where, readAt: null },
      });
    });

    it('flattens the task’s project onto the response', async () => {
      prisma.notification.findMany.mockResolvedValue([
        {
          id: 'n1',
          kind: 'TASK_ASSIGNED',
          createdAt: new Date('2026-09-30T08:00:00.000Z'),
          readAt: null,
          actor: { id: 'd1', firstName: 'Anna', lastName: 'Kowalska' },
          task: {
            id: 't1',
            title: 'Kupić zeszyty',
            dueDate: null,
            status: 'NEW',
            activity: {
              stage: { project: { id: 'p1', name: 'Solina' } },
            },
          },
        },
      ]);
      prisma.notification.count.mockResolvedValue(1);

      const result = await service.findMine(oleg);

      expect(result).toEqual({
        unreadCount: 1,
        items: [
          {
            id: 'n1',
            kind: 'TASK_ASSIGNED',
            createdAt: new Date('2026-09-30T08:00:00.000Z'),
            readAt: null,
            actor: { id: 'd1', firstName: 'Anna', lastName: 'Kowalska' },
            task: {
              id: 't1',
              title: 'Kupić zeszyty',
              dueDate: null,
              status: 'NEW',
            },
            project: { id: 'p1', name: 'Solina' },
          },
        ],
      });
    });
  });

  describe('read state', () => {
    it('marks only a notification addressed to the viewer', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markRead('n1', oleg);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'n1', userId: 'oleg' },
        data: { readAt: expect.any(Date) as Date },
      });
    });

    it('404s someone else’s notification', async () => {
      prisma.notification.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.markRead('n9', oleg)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('marks all of the viewer’s unread ones', async () => {
      await service.markAllRead(oleg);

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'oleg', readAt: null },
        data: { readAt: expect.any(Date) as Date },
      });
    });
  });
});
