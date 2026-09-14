import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

type Db = Prisma.TransactionClient;

export interface TaskLocation {
  taskId: string;
  activityId: string;
  stageId: string;
  projectId: string;
  ownerId: string | null;
}

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertExists(projectId: string, db: Db = this.prisma): Promise<void> {
    const found = await db.project.count({ where: { id: projectId } });
    if (found === 0) throw new NotFoundException('Project not found');
  }

  async assertCanRead(
    actor: AuthenticatedUser,
    projectId: string,
    db: Db = this.prisma,
  ): Promise<void> {
    await this.assertExists(projectId, db);

    if (actor.isDirector) return;

    const member = await db.projectMember.count({
      where: { projectId, userId: actor.id },
    });
    if (member === 0) throw new NotFoundException('Project not found');
  }

  async locateTask(
    taskId: string,
    db: Db = this.prisma,
  ): Promise<TaskLocation> {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        activityId: true,
        ownerId: true,
        activity: {
          select: { stageId: true, stage: { select: { projectId: true } } },
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    return {
      taskId: task.id,
      activityId: task.activityId,
      stageId: task.activity.stageId,
      projectId: task.activity.stage.projectId,
      ownerId: task.ownerId,
    };
  }

  async locateActivity(
    activityId: string,
    db: Db = this.prisma,
  ): Promise<{ stageId: string; projectId: string }> {
    const activity = await db.activity.findUnique({
      where: { id: activityId },
      select: { stageId: true, stage: { select: { projectId: true } } },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    return { stageId: activity.stageId, projectId: activity.stage.projectId };
  }

  async canManageTasks(
    actor: AuthenticatedUser,
    projectId: string,
    db: Db = this.prisma,
  ): Promise<boolean> {
    if (actor.isDirector) return true;

    const coordinates = await db.projectMember.count({
      where: { projectId, userId: actor.id, projectRole: 'COORDINATOR' },
    });
    return coordinates > 0;
  }

  async assertCanManageTasks(
    actor: AuthenticatedUser,
    projectId: string,
    db: Db = this.prisma,
  ): Promise<void> {
    if (await this.canManageTasks(actor, projectId, db)) return;
    throw new ForbiddenException(
      'Only a director or a coordinator of this project can manage its tasks',
    );
  }

  async assertCanChangeTaskStatus(
    actor: AuthenticatedUser,
    task: TaskLocation,
    db: Db = this.prisma,
  ): Promise<void> {
    if (task.ownerId === actor.id) return;

    if (await this.canManageTasks(actor, task.projectId, db)) return;
    throw new ForbiddenException(
      'Only the task owner, a coordinator of this project or a director can change its status',
    );
  }

  assertOwnsTask(actor: AuthenticatedUser, task: TaskLocation): void {
    if (task.ownerId === actor.id) return;
    throw new ForbiddenException(
      'Only the person the task is assigned to can manage its subtasks',
    );
  }
}
