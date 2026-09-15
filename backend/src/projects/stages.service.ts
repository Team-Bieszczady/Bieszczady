import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Stage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { PERSON_SELECT } from './prisma-selects';
import { ProjectAccessService } from './project-access.service';
import { StageCompletionService } from './stage-completion.service';
import {
  shiftDays,
  suggestFollowingStageShifts,
} from './shift-following-stages';
import {
  ApplyStageShiftsDto,
  CreateStageDto,
  DeleteStageQueryDto,
  MoveStageDeadlineDto,
  UpdateStageDto,
} from './dto/stage.dto';

@Injectable()
export class StagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly completion: StageCompletionService,
    private readonly access: ProjectAccessService,
  ) {}

  private async findStageOrThrow(id: string) {
    const stage = await this.prisma.stage.findUnique({
      where: { id },
      include: {
        project: { select: { startDate: true, plannedEndDate: true } },
      },
    });
    if (!stage) throw new NotFoundException('Nie znaleziono etapu');
    return stage;
  }

  /**
   * A stage lives inside its project's window. Both project dates are nullable,
   * so each bound only applies when the project actually carries it. Bounds are
   * inclusive — a stage may start on the project's first day and end on its last.
   */
  private assertWithinProject(
    project: { startDate: Date | null; plannedEndDate: Date | null },
    startDate: Date | null,
    deadline: Date,
  ): void {
    const from = startDate ?? deadline;

    if (project.startDate && from < project.startDate) {
      throw new ConflictException(
        'Etap nie może zaczynać się przed datą startu projektu',
      );
    }
    if (project.plannedEndDate && deadline > project.plannedEndDate) {
      throw new ConflictException(
        'Termin etapu nie może być późniejszy niż data zakończenia projektu',
      );
    }
  }

  /** `deadline` is a DATE column, `completedAt` a timestamp — compare by day. */
  private static startOfDay(value: Date): Date {
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  async findAllForProject(
    projectId: string,
    includeArchived: boolean,
    viewer: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(viewer, projectId);

    const stages = await this.prisma.stage.findMany({
      where: {
        projectId,
        ...(includeArchived ? {} : { archivedAt: null }),
      },
      orderBy: [{ sortOrder: 'asc' }, { deadline: 'asc' }],
      include: {
        activities: {
          orderBy: { sortOrder: 'asc' },
          include: {
            tasks: {
              orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                owner: PERSON_SELECT,
              },
            },
          },
        },
      },
    });

    return stages.map((stage) => {
      const tasks = stage.activities.flatMap((activity) => activity.tasks);
      const total = tasks.length;
      const done = tasks.filter((task) => task.status === 'DONE').length;

      return {
        id: stage.id,
        projectId: stage.projectId,
        name: stage.name,
        description: stage.description,
        sortOrder: stage.sortOrder,
        startDate: stage.startDate,
        deadline: stage.deadline,
        originalDeadline: stage.originalDeadline,
        deadlineNote: stage.deadlineNote,
        completedAt: stage.completedAt,
        archivedAt: stage.archivedAt,
        counts: { total, done, pending: total - done },
        activities: stage.activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          sortOrder: activity.sortOrder,
          taskCount: activity.tasks.length,
          tasks: activity.tasks,
        })),
      };
    });
  }

  async create(projectId: string, dto: CreateStageDto) {
    await this.access.assertNotArchived(projectId);

    const deadline = new Date(dto.deadline);
    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (startDate && startDate > deadline) {
      throw new ConflictException(
        'Termin nie może być wcześniejszy niż data rozpoczęcia',
      );
    }

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      select: { startDate: true, plannedEndDate: true },
    });
    this.assertWithinProject(project, startDate, deadline);

    const last = await this.prisma.stage.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });

    return this.prisma.stage.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description ?? '',
        sortOrder: (last._max.sortOrder ?? 0) + 1,
        startDate,
        deadline,
      },
    });
  }

  async update(id: string, dto: UpdateStageDto) {
    const stage = await this.findStageOrThrow(id);
    await this.access.assertNotArchived(stage.projectId);

    const data: Prisma.StageUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.stage.update({ where: { id }, data });
  }

  async moveDeadline(id: string, dto: MoveStageDeadlineDto) {
    const stage = await this.findStageOrThrow(id);
    await this.access.assertNotArchived(stage.projectId);
    const next = new Date(dto.deadline);

    if (stage.startDate && next < stage.startDate) {
      throw new ConflictException(
        'Termin nie może być wcześniejszy niż data rozpoczęcia',
      );
    }
    if (
      stage.completedAt &&
      next < StagesService.startOfDay(stage.completedAt)
    ) {
      throw new ConflictException(
        'Termin nie może być wcześniejszy niż data zakończenia etapu',
      );
    }
    this.assertWithinProject(stage.project, stage.startDate, next);

    const days = shiftDays(stage.deadline, next);

    const updated = await this.prisma.stage.update({
      where: { id },
      data: {
        originalDeadline: stage.originalDeadline ?? stage.deadline,
        deadline: next,
        deadlineNote: dto.note?.trim() ? dto.note.trim() : null,
      },
    });

    const siblings = await this.prisma.stage.findMany({
      where: { projectId: stage.projectId },
      orderBy: [{ sortOrder: 'asc' }, { deadline: 'asc' }],
      select: {
        id: true,
        name: true,
        deadline: true,
        completedAt: true,
        archivedAt: true,
      },
    });

    return {
      stage: updated,
      suggestions: suggestFollowingStageShifts(siblings, id, days),
    };
  }

  async applyFollowingStageShifts(dto: ApplyStageShiftsDto) {
    const ids = dto.shifts.map((shift) => shift.stageId);

    return this.prisma.$transaction(async (tx) => {
      const stages = await tx.stage.findMany({
        where: { id: { in: ids } },
        include: {
          project: { select: { startDate: true, plannedEndDate: true } },
        },
      });
      if (stages.length !== ids.length) {
        throw new NotFoundException('Nie znaleziono jednego lub więcej etapów');
      }

      for (const projectId of new Set(stages.map((stage) => stage.projectId))) {
        await this.access.assertNotArchived(projectId, tx);
      }

      const byId = new Map(stages.map((stage) => [stage.id, stage]));
      const updated: Stage[] = [];

      for (const shift of dto.shifts) {
        const stage = byId.get(shift.stageId)!;
        const next = new Date(shift.deadline);
        if (stage.startDate && next < stage.startDate) {
          throw new ConflictException(
            'Termin nie może być wcześniejszy niż data rozpoczęcia',
          );
        }
        if (
          stage.completedAt &&
          next < StagesService.startOfDay(stage.completedAt)
        ) {
          throw new ConflictException(
            'Termin nie może być wcześniejszy niż data zakończenia etapu',
          );
        }
        this.assertWithinProject(stage.project, stage.startDate, next);

        updated.push(
          await tx.stage.update({
            where: { id: stage.id },
            data: {
              originalDeadline: stage.originalDeadline ?? stage.deadline,
              deadline: next,
              deadlineNote: dto.note?.trim() ? dto.note.trim() : null,
            },
          }),
        );
      }

      return updated;
    }, SERIALIZABLE);
  }

  async setArchived(id: string, archived: boolean) {
    const stage = await this.findStageOrThrow(id);
    await this.access.assertNotArchived(stage.projectId);

    return this.prisma.stage.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
    });
  }

  async remove(id: string, query: DeleteStageQueryDto): Promise<void> {
    const strategy = query.strategy ?? 'none';

    await this.prisma.$transaction(async (tx) => {
      const stage = await tx.stage.findUnique({ where: { id } });
      if (!stage) throw new NotFoundException('Nie znaleziono etapu');
      await this.access.assertNotArchived(stage.projectId, tx);

      const activityCount = await tx.activity.count({
        where: { stageId: id },
      });

      if (activityCount > 0 && strategy === 'none') {
        throw new ConflictException(
          `Etap ma przypisane działania (${activityCount}) — wybierz, czy przenieść je, czy usunąć`,
        );
      }

      if (strategy === 'move') {
        const target = await tx.stage.findUnique({
          where: { id: query.targetStageId },
        });
        if (!target || target.id === id) {
          throw new NotFoundException('Nie znaleziono etapu docelowego');
        }
        if (target.projectId !== stage.projectId) {
          throw new ConflictException(
            'Etap docelowy należy do innego projektu',
          );
        }

        await tx.activity.updateMany({
          where: { stageId: id },
          data: { stageId: target.id },
        });

        await this.completion.settle(tx, [target.id]);
      } else if (strategy === 'delete') {
        await tx.subtask.deleteMany({
          where: { task: { activity: { stageId: id } } },
        });
        await tx.task.deleteMany({ where: { activity: { stageId: id } } });
        await tx.activity.deleteMany({ where: { stageId: id } });
      }

      await tx.stage.delete({ where: { id } });
    }, SERIALIZABLE);
  }
}
