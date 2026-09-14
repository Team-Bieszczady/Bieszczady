import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { ProjectAccessService } from './project-access.service';
import { CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async findAllForProject(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);

    return this.prisma.goal.findMany({
      where: { projectId },
      orderBy: { goalNumber: 'asc' },
    });
  }

  async create(projectId: string, dto: CreateGoalDto) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.count({ where: { id: projectId } });
      if (project === 0) throw new NotFoundException('Project not found');

      const last = await tx.goal.aggregate({
        where: { projectId },
        _max: { goalNumber: true },
      });

      return tx.goal.create({
        data: {
          projectId,
          goalNumber: (last._max.goalNumber ?? 0) + 1,
          title: dto.title,
          description: dto.description ?? '',
        },
      });
    }, SERIALIZABLE);
  }

  async update(id: string, dto: UpdateGoalDto) {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal) throw new NotFoundException('Goal not found');

    const data: Prisma.GoalUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.goal.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const goal = await tx.goal.findUnique({ where: { id } });
      if (!goal) throw new NotFoundException('Goal not found');

      await tx.goal.delete({ where: { id } });

      const remaining = await tx.goal.findMany({
        where: { projectId: goal.projectId },
        orderBy: { goalNumber: 'asc' },
        select: { id: true, goalNumber: true },
      });

      for (const [index, entry] of remaining.entries()) {
        if (entry.goalNumber === index + 1) continue;
        await tx.goal.update({
          where: { id: entry.id },
          data: { goalNumber: -(index + 1) },
        });
      }
      for (const [index, entry] of remaining.entries()) {
        if (entry.goalNumber === index + 1) continue;
        await tx.goal.update({
          where: { id: entry.id },
          data: { goalNumber: index + 1 },
        });
      }
    }, SERIALIZABLE);
  }
}
