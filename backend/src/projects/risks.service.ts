import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { ProjectAccessService } from './project-access.service';
import { PERSON_SELECT } from './prisma-selects';
import { CreateRiskDto, UpdateRiskDto } from './dto/risk.dto';

@Injectable()
export class RisksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  private async assertResponsibleIsMember(
    projectId: string,
    userId: string | null | undefined,
  ): Promise<void> {
    if (!userId) return;

    const member = await this.prisma.projectMember.count({
      where: { projectId, userId },
    });
    if (member === 0) {
      throw new ConflictException(
        'The responsible user must be a member of this project',
      );
    }
  }

  async findAllForProject(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);

    return this.prisma.risk.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: { responsible: PERSON_SELECT },
    });
  }

  async create(projectId: string, dto: CreateRiskDto) {
    await this.access.assertExists(projectId);
    await this.assertResponsibleIsMember(projectId, dto.responsibleUserId);

    return this.prisma.risk.create({
      data: {
        projectId,
        description: dto.description,
        probability: dto.probability ?? 'MEDIUM',
        impact: dto.impact ?? 'MEDIUM',
        responsibleUserId: dto.responsibleUserId ?? null,
      },
      include: { responsible: PERSON_SELECT },
    });
  }

  async update(id: string, dto: UpdateRiskDto) {
    const risk = await this.prisma.risk.findUnique({ where: { id } });
    if (!risk) throw new NotFoundException('Risk not found');

    if (dto.responsibleUserId !== undefined) {
      await this.assertResponsibleIsMember(
        risk.projectId,
        dto.responsibleUserId,
      );
    }

    const data: Prisma.RiskUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.probability !== undefined) data.probability = dto.probability;
    if (dto.impact !== undefined) data.impact = dto.impact;
    if (dto.responsibleUserId !== undefined) {
      data.responsible = dto.responsibleUserId
        ? { connect: { id: dto.responsibleUserId } }
        : { disconnect: true };
    }

    return this.prisma.risk.update({
      where: { id },
      data,
      include: { responsible: PERSON_SELECT },
    });
  }

  async remove(id: string): Promise<void> {
    const risk = await this.prisma.risk.findUnique({ where: { id } });
    if (!risk) throw new NotFoundException('Risk not found');

    await this.prisma.risk.delete({ where: { id } });
  }
}
