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
import { PERSON_SELECT } from './prisma-selects';
import {
  AddMemberDto,
  UpdateMemberPartnerDto,
  UpdateMemberRoleDto,
} from './dto/member.dto';

const USER_SELECT = {
  select: {
    ...PERSON_SELECT.select,
    email: true,
    avatar: true,
    accountStatus: true,
  },
} satisfies { select: Prisma.UserSelect };

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
      select: { ...PERSON_SELECT.select, email: true, avatar: true },
    });
  }

  async add(projectId: string, dto: AddMemberDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.access.assertNotArchived(projectId, tx);

      const user = await tx.user.findFirst({
        where: { id: dto.userId, deletedAt: null },
        select: { id: true, accountStatus: true },
      });
      if (!user) throw new NotFoundException('Nie znaleziono użytkownika');
      if (user.accountStatus !== 'ACTIVE') {
        throw new ConflictException(
          'Do projektu można dodać tylko aktywnych użytkowników',
        );
      }

      const already = await tx.projectMember.count({
        where: { projectId, userId: dto.userId },
      });
      if (already > 0) {
        throw new ConflictException(
          'Ten użytkownik jest już członkiem projektu',
        );
      }

      await tx.documentAccess.deleteMany({
        where: { projectId, userId: dto.userId },
      });

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
    if (!member) throw new NotFoundException('Nie znaleziono członka projektu');
    await this.access.assertNotArchived(member.projectId);

    return this.prisma.projectMember.update({
      where: { id },
      data: {
        projectRole: dto.projectRole,
        ...(dto.projectRole === 'PARTNER' ? {} : { partnerId: null }),
      },
      include: { user: USER_SELECT },
    });
  }

  async setPartner(id: string, dto: UpdateMemberPartnerDto) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.findUnique({ where: { id } });
      if (!member) {
        throw new NotFoundException('Nie znaleziono członka projektu');
      }
      await this.access.assertNotArchived(member.projectId, tx);

      if (dto.partnerId !== null) {
        if (member.projectRole !== 'PARTNER') {
          throw new ConflictException(
            'Organizację partnera można przypisać tylko osobie z rolą Partner',
          );
        }
        const linked = await tx.partnerProject.count({
          where: { partnerId: dto.partnerId, projectId: member.projectId },
        });
        if (linked === 0) {
          throw new ConflictException(
            'Ten partner nie jest przypisany do projektu',
          );
        }
      }

      return tx.projectMember.update({
        where: { id },
        data: { partnerId: dto.partnerId },
        include: { user: USER_SELECT },
      });
    }, SERIALIZABLE);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.findUnique({ where: { id } });
      if (!member)
        throw new NotFoundException('Nie znaleziono członka projektu');
      await this.access.assertNotArchived(member.projectId, tx);

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
      await tx.indicator.updateMany({
        where: { projectId: member.projectId, ownerId: member.userId },
        data: { ownerId: null },
      });
      await tx.documentAccess.deleteMany({
        where: { projectId: member.projectId, userId: member.userId },
      });
      await tx.budgetAccess.deleteMany({
        where: { projectId: member.projectId, userId: member.userId },
      });

      await tx.projectMember.delete({ where: { id } });
    }, SERIALIZABLE);
  }
}
