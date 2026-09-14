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
    const stage = await this.prisma.stage.findUnique({ where: { id } });
    if (!stage) throw new NotFoundException('Stage not found');
    return stage;
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
    await this.access.assertExists(projectId);

    const deadline = new Date(dto.deadline);
    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (startDate && startDate > deadline) {
      throw new ConflictException(
        'Deadline cannot be earlier than the start date',
      );
    }

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
    await this.findStageOrThrow(id);

    const data: Prisma.StageUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.stage.update({ where: { id }, data });
  }

  async moveDeadline(id: string, dto: MoveStageDeadlineDto) {
    const stage = await this.findStageOrThrow(id);
    const next = new Date(dto.deadline);

    if (stage.startDate && next < stage.startDate) {
      throw new ConflictException(
        'Deadline cannot be earlier than the start date',
      );
    }
    if (stage.completedAt && next < stage.completedAt) {
      throw new ConflictException(
        'Deadline cannot be earlier than the date the stage finished',
      );
    }

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
      const stages = await tx.stage.findMany({ where: { id: { in: ids } } });
      if (stages.length !== ids.length) {
        throw new NotFoundException('One or more stages not found');
      }

      const byId = new Map(stages.map((stage) => [stage.id, stage]));
      const updated: Stage[] = [];

      for (const shift of dto.shifts) {
        const stage = byId.get(shift.stageId)!;
        updated.push(
          await tx.stage.update({
            where: { id: stage.id },
            data: {
              originalDeadline: stage.originalDeadline ?? stage.deadline,
              deadline: new Date(shift.deadline),
              deadlineNote: dto.note?.trim() ? dto.note.trim() : null,
            },
          }),
        );
      }

      return updated;
    }, SERIALIZABLE);
  }

  async setArchived(id: string, archived: boolean) {
    await this.findStageOrThrow(id);

    return this.prisma.stage.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
    });
  }

  async remove(id: string, query: DeleteStageQueryDto): Promise<void> {
    const strategy = query.strategy ?? 'none';

    await this.prisma.$transaction(async (tx) => {
      const stage = await tx.stage.findUnique({ where: { id } });
      if (!stage) throw new NotFoundException('Stage not found');

      const activityCount = await tx.activity.count({
        where: { stageId: id },
      });

      if (activityCount > 0 && strategy === 'none') {
        throw new ConflictException(
          `Stage has ${activityCount} activity(ies): choose strategy=move or strategy=delete`,
        );
      }

      if (strategy === 'move') {
        const target = await tx.stage.findUnique({
          where: { id: query.targetStageId },
        });
        if (!target || target.id === id) {
          throw new NotFoundException('Target stage not found');
        }
        if (target.projectId !== stage.projectId) {
          throw new ConflictException(
            'Target stage belongs to a different project',
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
