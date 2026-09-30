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
      actor: event.actor
        ? {
            id: event.actor.id,
            firstName: event.actor.firstName,
            lastName: event.actor.lastName,
          }
        : null,
      project: {
        id: event.project.id,
        name: event.project.name,
        color: event.project.color,
      },
    };
  }

  /**
   * A task passing its deadline is the one event nobody performs, so there is
   * no request to hang it off. Rather than add a scheduler, the sweep runs when
   * someone actually opens the history — `dedupeKey` is what makes that safe:
   * a repeat insert hits the unique index instead of adding a second row.
   *
   * Skipped while paging, or every infinite-scroll page would re-run it.
   */
  private async sweepOverdueTasks(): Promise<void> {
    // The frontend calls a task overdue by comparing calendar days in the
    // Polish timezone; `dueDate` is stored at UTC midnight of a bare date.
    // Building the cutoff the same way keeps the two from disagreeing for the
    // first hours of each day.
    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Europe/Warsaw',
    });

    const overdue = await this.prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        dueDate: { lt: new Date(`${today}T00:00:00.000Z`) },
        // An archived project is read-only for everyone, and an event is a
        // write.
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

    for (const task of overdue) {
      const day = task.dueDate!.toISOString().slice(0, 10);
      const [year, month, date] = day.split('-');
      const deadline = `${date}.${month}.${year}`;

      try {
        await this.prisma.projectEvent.create({
          data: {
            projectId: task.activity.stage.projectId,
            // The person answerable for the task, so the page prints their
            // name in bold like any other row. Null only when nobody holds it.
            actorId: task.ownerId,
            source: 'AUTOMATIC',
            content: task.ownerId
              ? `nie ukończył(a) w terminie zadania „${task.title}” (termin: ${deadline})`
              : `Zadanie „${task.title}” przekroczyło termin realizacji (termin: ${deadline}) — brak wykonawcy`,
            dedupeKey: `overdue:${task.id}:${day}`,
          },
        });
      } catch (error) {
        // Already recorded by an earlier sweep, or by one running concurrently
        // for another viewer. `createMany({ skipDuplicates })` is not an option
        // here — SQL Server does not support it.
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
