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
    if (found === 0) throw new NotFoundException('Nie znaleziono projektu');
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
    if (member === 0) throw new NotFoundException('Nie znaleziono projektu');
  }

  /**
   * An archived project is read-only: every write beneath it is refused, for
   * everyone, a director included. The three exits — archive, restore and
   * permanent delete — deliberately do not call this.
   *
   * Truthiness, not `!== null`: against a real row the two are identical, but a
   * mock that omits `archivedAt` would read as archived under `!== null`.
   */
  async assertNotArchived(
    projectId: string,
    db: Db = this.prisma,
  ): Promise<void> {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { archivedAt: true },
    });
    if (!project) throw new NotFoundException('Nie znaleziono projektu');
    if (project.archivedAt) {
      throw new ForbiddenException(
        'Projekt jest zarchiwizowany i tylko do odczytu. Przywróć go, aby wprowadzić zmiany',
      );
    }
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
    if (!task) throw new NotFoundException('Nie znaleziono zadania');

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
    if (!activity) throw new NotFoundException('Nie znaleziono działania');

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
      'Tylko dyrektor lub koordynator tego projektu może zarządzać jego zadaniami',
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
      'Status zadania może zmienić tylko jego wykonawca, koordynator projektu lub dyrektor',
    );
  }

  assertOwnsTask(actor: AuthenticatedUser, task: TaskLocation): void {
    if (task.ownerId === actor.id) return;
    throw new ForbiddenException(
      'Listę kroków może edytować tylko osoba, do której przypisano zadanie',
    );
  }
}
