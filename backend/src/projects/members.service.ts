import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { ProjectAccessService } from './project-access.service';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/member.dto';

const USER_SELECT = {
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    avatar: true,
    accountStatus: true,
  },
};

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async findAllForProject(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);

    return this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { joinedAt: 'asc' },
      include: { user: USER_SELECT },
    });
  }

  async findAvailable(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);

    return this.prisma.user.findMany({
      where: {
        accountStatus: 'ACTIVE',
        deletedAt: null,
        isDirector: false,
        projectMemberships: { none: { projectId } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
      },
    });
  }

  async add(projectId: string, dto: AddMemberDto) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.count({ where: { id: projectId } });
      if (project === 0) throw new NotFoundException('Project not found');

      const user = await tx.user.findFirst({
        where: { id: dto.userId, deletedAt: null },
        select: { id: true, accountStatus: true },
      });
      if (!user) throw new NotFoundException('User not found');
      if (user.accountStatus !== 'ACTIVE') {
        throw new ConflictException(
          'Only active users can be added to a project',
        );
      }

      const already = await tx.projectMember.count({
        where: { projectId, userId: dto.userId },
      });
      if (already > 0) {
        throw new ConflictException('User is already a member of this project');
      }

      return tx.projectMember.create({
        data: {
          projectId,
          userId: dto.userId,
          projectRole: dto.projectRole,
        },
        include: { user: USER_SELECT },
      });
    }, SERIALIZABLE);
  }

  async setRole(id: string, dto: UpdateMemberRoleDto) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id },
    });
    if (!member) throw new NotFoundException('Project member not found');

    return this.prisma.projectMember.update({
      where: { id },
      data: { projectRole: dto.projectRole },
      include: { user: USER_SELECT },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.findUnique({ where: { id } });
      if (!member) throw new NotFoundException('Project member not found');

      await tx.risk.updateMany({
        where: {
          projectId: member.projectId,
          responsibleUserId: member.userId,
        },
        data: { responsibleUserId: null },
      });
      await tx.task.updateMany({
        where: {
          ownerId: member.userId,
          activity: { stage: { projectId: member.projectId } },
        },
        data: { ownerId: null },
      });

      await tx.projectMember.delete({ where: { id } });
    }, SERIALIZABLE);
  }
}
