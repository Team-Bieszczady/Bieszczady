import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import { PERSON_SELECT } from './prisma-selects';
import { StageCompletionService } from './stage-completion.service';
import { ProjectAccessService } from './project-access.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
} from './dto/task.dto';

const TASK_INCLUDE = {
  owner: PERSON_SELECT,
  subtasks: { orderBy: { sortOrder: 'asc' } },
  activity: {
    select: {
      id: true,
      name: true,
      stage: {
        select: {
          id: true,
          name: true,
          deadline: true,
          archivedAt: true,
          projectId: true,
        },
      },
    },
  },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof TASK_INCLUDE }>;

const TASK_ORDER: Prisma.TaskOrderByWithRelationInput[] = [
  { dueDate: 'asc' },
  { title: 'asc' },
];

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly completion: StageCompletionService,
    private readonly access: ProjectAccessService,
  ) {}

  private toResponse(task: TaskRow) {
    const total = task.subtasks.length;
    const done = task.subtasks.filter((subtask) => subtask.done).length;

    return {
      id: task.id,
      activityId: task.activityId,
      projectId: task.activity.stage.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      owner: task.owner,
      activity: { id: task.activity.id, name: task.activity.name },
      stage: {
        id: task.activity.stage.id,
        name: task.activity.stage.name,
        deadline: task.activity.stage.deadline,
        archivedAt: task.activity.stage.archivedAt,
      },

      subtaskProgress: {
        done,
        total,
        percent: total === 0 ? 0 : Math.round((done / total) * 100),
      },
      subtasks: task.subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        done: subtask.done,
        sortOrder: subtask.sortOrder,
      })),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  private async assertOwnerIsMember(
    projectId: string,
    userId: string | null | undefined,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    if (!userId) return;

    const member = await db.projectMember.count({
      where: { projectId, userId },
    });
    if (member === 0) {
      throw new ConflictException(
        'The task owner must be a member of this project',
      );
    }
  }

  private whereInProject(
    projectId: string,
    includeArchived: boolean,
  ): Prisma.TaskWhereInput {
    return {
      activity: {
        stage: {
          projectId,
          ...(includeArchived ? {} : { archivedAt: null }),
        },
      },
    };
  }

  async findAllForProject(
    projectId: string,
    actor: AuthenticatedUser,
    includeArchived = false,
  ) {
    await this.access.assertCanRead(actor, projectId);

    const tasks = await this.prisma.task.findMany({
      where: this.whereInProject(projectId, includeArchived),
      orderBy: TASK_ORDER,
      include: TASK_INCLUDE,
    });

    return tasks.map((task) => this.toResponse(task));
  }

  async findMineForProject(
    projectId: string,
    actor: AuthenticatedUser,
    includeArchived = false,
  ) {
    await this.access.assertCanRead(actor, projectId);

    const tasks = await this.prisma.task.findMany({
      where: {
        ownerId: actor.id,
        ...this.whereInProject(projectId, includeArchived),
      },
      orderBy: TASK_ORDER,
      include: TASK_INCLUDE,
    });

    return tasks.map((task) => this.toResponse(task));
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const location = await this.access.locateTask(id);
    await this.access.assertCanRead(actor, location.projectId);

    const task = await this.prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.toResponse(task);
  }

  async create(
    activityId: string,
    dto: CreateTaskDto,
    actor: AuthenticatedUser,
  ) {
    const { stageId, projectId } = await this.access.locateActivity(activityId);
    await this.access.assertCanManageTasks(actor, projectId);
    await this.assertOwnerIsMember(projectId, dto.ownerId);

    const created = await this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          activityId,
          title: dto.title,
          description: dto.description ?? '',
          status: dto.status ?? 'NEW',
          priority: dto.priority ?? 'MEDIUM',
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          ownerId: dto.ownerId ?? null,
        },
        include: TASK_INCLUDE,
      });

      await this.completion.settle(tx, [stageId]);
      return task;
    }, SERIALIZABLE);

    return this.toResponse(created);
  }

  async update(id: string, dto: UpdateTaskDto, actor: AuthenticatedUser) {
    const task = await this.access.locateTask(id);
    await this.access.assertCanManageTasks(actor, task.projectId);

    if (dto.ownerId !== undefined) {
      await this.assertOwnerIsMember(task.projectId, dto.ownerId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.TaskUpdateInput = {};
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.priority !== undefined) data.priority = dto.priority;
      if (dto.dueDate !== undefined) {
        data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
      }
      if (dto.ownerId !== undefined) {
        data.owner = dto.ownerId
          ? { connect: { id: dto.ownerId } }
          : { disconnect: true };
      }

      let movedFrom: string | null = null;
      if (dto.activityId !== undefined && dto.activityId !== task.activityId) {
        const target = await this.access.locateActivity(dto.activityId, tx);
        if (target.projectId !== task.projectId) {
          throw new ConflictException(
            'The target activity belongs to a different project',
          );
        }

        data.activity = { connect: { id: dto.activityId } };
        movedFrom = task.stageId;
      }

      const row = await tx.task.update({
        where: { id },
        data,
        include: TASK_INCLUDE,
      });

      if (movedFrom) {
        await this.completion.settle(tx, [movedFrom, row.activity.stage.id]);
      }

      return row;
    }, SERIALIZABLE);

    return this.toResponse(updated);
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    actor: AuthenticatedUser,
  ) {
    const task = await this.access.locateTask(id);
    await this.access.assertCanChangeTaskStatus(actor, task);

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.task.update({
        where: { id },
        data: { status: dto.status },
        include: TASK_INCLUDE,
      });

      await this.completion.settle(tx, [task.stageId]);
      return row;
    }, SERIALIZABLE);

    return this.toResponse(updated);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const task = await this.access.locateTask(id);
    await this.access.assertCanManageTasks(actor, task.projectId);

    await this.prisma.$transaction(async (tx) => {
      await tx.subtask.deleteMany({ where: { taskId: id } });
      await tx.task.delete({ where: { id } });
      await this.completion.settle(tx, [task.stageId]);
    }, SERIALIZABLE);
  }
}
