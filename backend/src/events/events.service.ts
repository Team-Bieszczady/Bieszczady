import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { PERSON_SELECT } from '../projects/prisma-selects';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { CreateManualEventDto, ListEventsQueryDto } from './dto/event.dto';

const PAGE_SIZE = 20;

const EVENT_INCLUDE = {
  actor: PERSON_SELECT,
  project: { select: { id: true, name: true, color: true } },
} satisfies Prisma.ProjectEventInclude;

type EventWithDetail = Prisma.ProjectEventGetPayload<{
  include: typeof EVENT_INCLUDE;
}>;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  private toDetail(event: EventWithDetail) {
    return {
      id: event.id,
      source: event.source,
      content: event.content,
      createdAt: event.createdAt,
      actor: event.actor,
      project: event.project,
    };
  }

  private async sweepOverdueTasks(): Promise<void> {
    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Europe/Warsaw',
    });

    const overdue = await this.prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        dueDate: { lt: new Date(`${today}T00:00:00.000Z`) },
        activity: { stage: { project: { archivedAt: null } } },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        ownerId: true,
        activity: { select: { stage: { select: { projectId: true } } } },
      },
    });

    if (overdue.length === 0) return;

    const dayOf = (task: (typeof overdue)[number]) =>
      task.dueDate!.toISOString().slice(0, 10);
    const keyOf = (task: (typeof overdue)[number]) =>
      `overdue:${task.id}:${dayOf(task)}`;
    const recorded = await this.prisma.projectEvent.findMany({
      where: { dedupeKey: { in: overdue.map(keyOf) } },
      select: { dedupeKey: true },
    });
    const recordedKeys = new Set(recorded.map((event) => event.dedupeKey));

    for (const task of overdue) {
      const dedupeKey = keyOf(task);
      if (recordedKeys.has(dedupeKey)) continue;

      const [year, month, date] = dayOf(task).split('-');
      const deadline = `${date}.${month}.${year}`;

      try {
        await this.prisma.projectEvent.create({
          data: {
            projectId: task.activity.stage.projectId,
            actorId: task.ownerId,
            source: 'AUTOMATIC',
            content: task.ownerId
              ? `nie ukończył(a) w terminie zadania „${task.title}” (termin: ${deadline})`
              : `Zadanie „${task.title}” przekroczyło termin realizacji (termin: ${deadline})`,
            dedupeKey,
          },
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

  async findAll(query: ListEventsQueryDto, viewer: AuthenticatedUser) {
    if (!query.cursor) await this.sweepOverdueTasks();

    const rows = await this.prisma.projectEvent.findMany({
      where: {
        ...(viewer.isDirector
          ? {}
          : { project: { members: { some: { userId: viewer.id } } } }),
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.source ? { source: query.source } : {}),
        ...(query.from ? { createdAt: { gte: new Date(query.from) } } : {}),
      },
      include: EVENT_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > PAGE_SIZE;
    const items = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    return {
      items: items.map((row) => this.toDetail(row)),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async create(dto: CreateManualEventDto, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, dto.projectId);
    await this.access.assertNotArchived(dto.projectId);

    const created = await this.prisma.projectEvent.create({
      data: {
        projectId: dto.projectId,
        actorId: viewer.id,
        source: 'MANUAL',
        content: dto.content,
      },
      include: EVENT_INCLUDE,
    });

    return this.toDetail(created);
  }
}
