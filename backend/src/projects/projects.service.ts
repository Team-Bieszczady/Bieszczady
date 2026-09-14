import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { ProjectAccessService } from './project-access.service';
import { CreateProjectDto } from './dto/create-project.dto';
import {
  UpdateProjectDto,
  UpdateProjectRecipientsDto,
  UpdateProjectStatusDto,
  UpdateProjectTypesDto,
} from './dto/update-project.dto';

const MS_PER_DAY = 86_400_000;

const DETAIL_INCLUDE = {
  status: true,
  types: { include: { projectType: true } },
  recipients: { include: { recipient: true } },
} satisfies Prisma.ProjectInclude;

type ProjectWithDetail = Prisma.ProjectGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

function assertDateOrder(start: Date | null, end: Date | null): void {
  if (start && end && start.getTime() > end.getTime()) {
    throw new ConflictException(
      'Project start date cannot be after the planned end date',
    );
  }
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  private toDetail(project: ProjectWithDetail) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      budgetAmount: project.budgetAmount?.toString() ?? null,
      startDate: project.startDate,
      plannedEndDate: project.plannedEndDate,
      archivedAt: project.archivedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status
        ? {
            id: project.status.id,
            name: project.status.name,
            color: project.status.color,
          }
        : null,
      types: project.types.map((link) => ({
        id: link.projectType.id,
        name: link.projectType.name,
      })),
      recipients: project.recipients.map((link) => ({
        id: link.recipient.id,
        name: link.recipient.name,
      })),
    };
  }

  private async findOrThrow(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async assertDictionaryIds(
    tx: Prisma.TransactionClient,
    typeIds: string[],
    recipientIds: string[],
    statusId?: string | null,
  ): Promise<void> {
    if (statusId) {
      const status = await tx.projectStatus.count({ where: { id: statusId } });
      if (status === 0) throw new NotFoundException('Project status not found');
    }
    if (typeIds.length > 0) {
      const found = await tx.projectType.count({
        where: { id: { in: typeIds } },
      });
      if (found !== typeIds.length) {
        throw new NotFoundException('One or more project types not found');
      }
    }
    if (recipientIds.length > 0) {
      const found = await tx.projectRecipient.count({
        where: { id: { in: recipientIds } },
      });
      if (found !== recipientIds.length) {
        throw new NotFoundException('One or more project recipients not found');
      }
    }
  }

  private async assertUsersAreActive(
    tx: Prisma.TransactionClient,
    userIds: string[],
  ): Promise<void> {
    if (userIds.length === 0) return;

    const active = await tx.user.count({
      where: { id: { in: userIds }, accountStatus: 'ACTIVE', deletedAt: null },
    });
    if (active !== userIds.length) {
      throw new ConflictException(
        'Only active users can be added to a project',
      );
    }
  }

  async create(dto: CreateProjectDto) {
    const typeIds = dto.typeIds ?? [];
    const recipientIds = dto.recipientIds ?? [];
    const members = dto.members ?? [];

    assertDateOrder(
      dto.startDate ? new Date(dto.startDate) : null,
      dto.plannedEndDate ? new Date(dto.plannedEndDate) : null,
    );

    const created = await this.prisma.$transaction(async (tx) => {
      await this.assertDictionaryIds(tx, typeIds, recipientIds, dto.statusId);
      await this.assertUsersAreActive(
        tx,
        members.map((member) => member.userId),
      );

      const project = await tx.project.create({
        data: {
          name: dto.name,
          description: dto.description ?? '',
          statusId: dto.statusId ?? null,
          color: dto.color ?? 'green',
          budgetAmount: dto.budgetAmount ?? null,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          plannedEndDate: dto.plannedEndDate
            ? new Date(dto.plannedEndDate)
            : null,
        },
      });

      if (typeIds.length > 0) {
        await tx.projectTypesOnProjects.createMany({
          data: typeIds.map((projectTypeId) => ({
            projectId: project.id,
            projectTypeId,
          })),
        });
      }
      if (recipientIds.length > 0) {
        await tx.projectRecipientsOnProjects.createMany({
          data: recipientIds.map((recipientId) => ({
            projectId: project.id,
            recipientId,
          })),
        });
      }
      if (members.length > 0) {
        await tx.projectMember.createMany({
          data: members.map((member) => ({
            projectId: project.id,
            userId: member.userId,
            projectRole: member.projectRole,
          })),
        });
      }

      return tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: DETAIL_INCLUDE,
      });
    }, SERIALIZABLE);

    return this.toDetail(created);
  }

  async findAll(
    includeArchived: boolean,
    viewer: { id: string; isDirector: boolean },
  ) {
    const projects = await this.prisma.project.findMany({
      where: {
        ...(includeArchived ? {} : { archivedAt: null }),
        ...(viewer.isDirector
          ? {}
          : { members: { some: { userId: viewer.id } } }),
      },
      include: {
        ...DETAIL_INCLUDE,
        _count: { select: { members: true } },
        members: {
          where: { userId: viewer.id },
          select: { projectRole: true },
        },
        stages: {
          where: { archivedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { deadline: 'asc' }],
          select: { id: true, completedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const today = new Date();

    return Promise.all(
      projects.map(async (project) => {
        const stageIds = project.stages.map((stage) => stage.id);
        const total = stageIds.length
          ? await this.prisma.task.count({
              where: { activity: { stageId: { in: stageIds } } },
            })
          : 0;
        const done = stageIds.length
          ? await this.prisma.task.count({
              where: {
                activity: { stageId: { in: stageIds } },
                status: 'DONE',
              },
            })
          : 0;

        const mine = stageIds.length
          ? await this.prisma.task.count({
              where: {
                activity: { stageId: { in: stageIds } },
                ownerId: viewer.id,
              },
            })
          : 0;

        const finishedStages = project.stages.filter(
          (stage) => stage.completedAt !== null,
        ).length;

        const currentStage = Math.min(
          finishedStages + 1,
          project.stages.length,
        );

        const viewerManages =
          viewer.isDirector ||
          project.members.some(
            (member) => member.projectRole === 'COORDINATOR',
          );

        return {
          ...this.toDetail(project),
          peopleCount: project._count.members,
          progress: total === 0 ? 0 : Math.round((done / total) * 100),
          taskCounts: { total, done, mine },
          viewerManages,
          stageCount: project.stages.length,
          stageLabel: project.stages.length
            ? `Etap ${currentStage}/${project.stages.length}`
            : 'Brak etapów',
          daysLeft: project.plannedEndDate
            ? Math.ceil(
                (project.plannedEndDate.getTime() - today.getTime()) /
                  MS_PER_DAY,
              )
            : null,
        };
      }),
    );
  }

  async findById(id: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, id);
    return this.toDetail(await this.findOrThrow(id));
  }

  async update(id: string, dto: UpdateProjectDto) {
    const current = await this.findOrThrow(id);

    const data: Prisma.ProjectUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.startDate !== undefined) {
      data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.plannedEndDate !== undefined) {
      data.plannedEndDate = dto.plannedEndDate
        ? new Date(dto.plannedEndDate)
        : null;
    }

    if (dto.startDate !== undefined || dto.plannedEndDate !== undefined) {
      assertDateOrder(
        dto.startDate !== undefined
          ? (data.startDate as Date | null)
          : current.startDate,
        dto.plannedEndDate !== undefined
          ? (data.plannedEndDate as Date | null)
          : current.plannedEndDate,
      );
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data,
      include: DETAIL_INCLUDE,
    });
    return this.toDetail(updated);
  }

  async setStatus(id: string, dto: UpdateProjectStatusDto) {
    await this.findOrThrow(id);

    if (dto.statusId) {
      const exists = await this.prisma.projectStatus.count({
        where: { id: dto.statusId },
      });
      if (exists === 0) throw new NotFoundException('Project status not found');
    }

    const updated = await this.prisma.project.update({
      where: { id },
      data: { statusId: dto.statusId },
      include: DETAIL_INCLUDE,
    });
    return this.toDetail(updated);
  }

  async setTypes(id: string, dto: UpdateProjectTypesDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.assertDictionaryIds(tx, dto.typeIds, []);
      await tx.projectTypesOnProjects.deleteMany({
        where: { projectId: id },
      });
      if (dto.typeIds.length > 0) {
        await tx.projectTypesOnProjects.createMany({
          data: dto.typeIds.map((projectTypeId) => ({
            projectId: id,
            projectTypeId,
          })),
        });
      }
      return tx.project.findUnique({
        where: { id },
        include: DETAIL_INCLUDE,
      });
    }, SERIALIZABLE);

    if (!updated) throw new NotFoundException('Project not found');
    return this.toDetail(updated);
  }

  async setRecipients(id: string, dto: UpdateProjectRecipientsDto) {
    const updated = await this.prisma.$transaction(async (tx) => {
      await this.assertDictionaryIds(tx, [], dto.recipientIds);
      await tx.projectRecipientsOnProjects.deleteMany({
        where: { projectId: id },
      });
      if (dto.recipientIds.length > 0) {
        await tx.projectRecipientsOnProjects.createMany({
          data: dto.recipientIds.map((recipientId) => ({
            projectId: id,
            recipientId,
          })),
        });
      }
      return tx.project.findUnique({
        where: { id },
        include: DETAIL_INCLUDE,
      });
    }, SERIALIZABLE);

    if (!updated) throw new NotFoundException('Project not found');
    return this.toDetail(updated);
  }

  async setArchived(id: string, archived: boolean) {
    await this.findOrThrow(id);

    const updated = await this.prisma.project.update({
      where: { id },
      data: { archivedAt: archived ? new Date() : null },
      include: DETAIL_INCLUDE,
    });
    return this.toDetail(updated);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id },
        select: { id: true, archivedAt: true },
      });
      if (!project) throw new NotFoundException('Project not found');
      if (project.archivedAt === null) {
        throw new ConflictException(
          'Archive the project before deleting it permanently',
        );
      }

      const stages = await tx.stage.findMany({
        where: { projectId: id },
        select: { id: true },
      });
      const stageIds = stages.map((stage) => stage.id);

      if (stageIds.length > 0) {
        await tx.subtask.deleteMany({
          where: { task: { activity: { stageId: { in: stageIds } } } },
        });
        await tx.task.deleteMany({
          where: { activity: { stageId: { in: stageIds } } },
        });
        await tx.activity.deleteMany({
          where: { stageId: { in: stageIds } },
        });
        await tx.stage.deleteMany({ where: { projectId: id } });
      }

      await tx.risk.deleteMany({ where: { projectId: id } });
      await tx.goal.deleteMany({ where: { projectId: id } });
      await tx.projectMember.deleteMany({ where: { projectId: id } });
      await tx.projectTypesOnProjects.deleteMany({
        where: { projectId: id },
      });
      await tx.projectRecipientsOnProjects.deleteMany({
        where: { projectId: id },
      });
      await tx.project.delete({ where: { id } });
    }, SERIALIZABLE);
  }
}
