import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PERSON_SELECT } from '../projects/prisma-selects';
import { MS_PER_DAY } from '../projects/shift-following-stages';
import type { NotificationKind } from '../common/enums/project.enums';
import type { AuthenticatedUser } from '../auth/types/auth.types';

const MAX_NOTIFICATIONS = 50;

const NOTIFICATION_INCLUDE = {
  actor: PERSON_SELECT,
  task: {
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      activity: {
        select: {
          stage: { select: { project: { select: { id: true, name: true } } } },
        },
      },
    },
  },
} satisfies Prisma.NotificationInclude;

type NotificationRow = Prisma.NotificationGetPayload<{
  include: typeof NOTIFICATION_INCLUDE;
}>;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(row: NotificationRow) {
    return {
      id: row.id,
      kind: row.kind as NotificationKind,
      createdAt: row.createdAt,
      readAt: row.readAt,
      actor: row.actor,
      task: {
        id: row.task.id,
        title: row.task.title,
        dueDate: row.task.dueDate,
        status: row.task.status,
      },
      project: row.task.activity.stage.project,
    };
  }

  private visibleTo(userId: string): Prisma.NotificationWhereInput {
    return {
      userId,
      task: {
        activity: {
          stage: {
            project: { archivedAt: null, members: { some: { userId } } },
          },
        },
      },
      OR: [
        { kind: 'TASK_ASSIGNED' },
        { task: { ownerId: userId, status: { not: 'DONE' } } },
      ],
    };
  }

  private async sweepDeadlines(userId: string): Promise<void> {
    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Europe/Warsaw',
    });
    const todayUtc = new Date(`${today}T00:00:00.000Z`);
    const tomorrow = new Date(todayUtc.getTime() + MS_PER_DAY)
      .toISOString()
      .slice(0, 10);

    const tasks = await this.prisma.task.findMany({
      where: {
        ownerId: userId,
        status: { not: 'DONE' },
        dueDate: { lte: new Date(`${tomorrow}T00:00:00.000Z`) },
        activity: { stage: { project: { archivedAt: null } } },
      },
      select: { id: true, dueDate: true },
    });

    const due = tasks.flatMap((task) => {
      const day = task.dueDate!.toISOString().slice(0, 10);
      const isDueSoon = day === tomorrow;
      if (!isDueSoon && day >= today) return [];

      const kind: NotificationKind = isDueSoon
        ? 'TASK_DUE_SOON'
        : 'TASK_OVERDUE';

      return [
        {
          taskId: task.id,
          kind,
          dedupeKey: `${isDueSoon ? 'due-soon' : 'overdue'}:${task.id}:${day}`,
          createdAt: new Date(
            task.dueDate!.getTime() + (isDueSoon ? -MS_PER_DAY : MS_PER_DAY),
          ),
        },
      ];
    });

    if (due.length === 0) return;

    const recorded = await this.prisma.notification.findMany({
      where: { dedupeKey: { in: due.map((notice) => notice.dedupeKey) } },
      select: { dedupeKey: true },
    });
    const recordedKeys = new Set(recorded.map((notice) => notice.dedupeKey));

    for (const notice of due) {
      if (recordedKeys.has(notice.dedupeKey)) continue;

      try {
        await this.prisma.notification.create({
          data: { ...notice, userId },
        });
      } catch (error) {
        if (!(
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )) {
          throw error;
        }
      }
    }
  }

  async findMine(viewer: AuthenticatedUser) {
    await this.sweepDeadlines(viewer.id);

    const where = this.visibleTo(viewer.id);
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: NOTIFICATION_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: MAX_NOTIFICATIONS,
      }),
      this.prisma.notification.count({ where: { ...where, readAt: null } }),
    ]);

    return { items: rows.map((row) => this.toResponse(row)), unreadCount };
  }

  async markRead(id: string, viewer: AuthenticatedUser): Promise<void> {
    const { count } = await this.prisma.notification.updateMany({
      where: { id, userId: viewer.id },
      data: { readAt: new Date() },
    });
    if (count === 0) {
      throw new NotFoundException('Nie znaleziono powiadomienia');
    }
  }

  async markAllRead(viewer: AuthenticatedUser): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId: viewer.id, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
