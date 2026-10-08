import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleAccessService } from '../users/module-access.service';
import { ListMeetingsQueryDto } from './dto/list-meetings-query.dto';

type Viewer = { id: string; isDirector: boolean };

@Injectable()
export class DeadlinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleAccess: ModuleAccessService,
  ) {}

  async findInRange(query: ListMeetingsQueryDto, viewer: Viewer) {
    if (query.from > query.to) {
      throw new BadRequestException(
        'Data początkowa nie może być późniejsza niż końcowa',
      );
    }

    if (
      !viewer.isDirector &&
      !(await this.moduleAccess.userHasModule(viewer.id, 'TASKS'))
    ) {
      return [];
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        dueDate: { gte: new Date(query.from), lte: new Date(query.to) },
        activity: { stage: this.openStageVisibleTo(viewer) },
      },
      orderBy: [{ dueDate: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        owner: { select: { firstName: true, lastName: true } },
        activity: {
          select: {
            stage: {
              select: {
                name: true,
                projectId: true,
                project: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return tasks.map(({ activity: { stage }, ...task }) => ({
      ...task,
      projectId: stage.projectId,
      projectName: stage.project.name,
      stageName: stage.name,
    }));
  }

  private openStageVisibleTo(viewer: Viewer): Prisma.StageWhereInput {
    if (viewer.isDirector) return { archivedAt: null };

    return {
      archivedAt: null,
      project: { members: { some: { userId: viewer.id } } },
    };
  }
}
