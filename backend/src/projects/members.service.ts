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
  PROJECT_SCOPED_MODULES,
  type ProjectScopedModule,
} from '../common/enums/module.enum';
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

const MEMBER_INCLUDE = {
  user: USER_SELECT,
  modules: { select: { module: true } },
} satisfies Prisma.ProjectMemberInclude;

type MemberRow = Prisma.ProjectMemberGetPayload<{
  include: typeof MEMBER_INCLUDE;
}>;

function toMember(row: MemberRow) {
  return { ...row, modules: row.modules.map(({ module }) => module) };
}

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async findAllForProject(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);

    const rows = await this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { joinedAt: 'asc' },
      include: MEMBER_INCLUDE,
    });
    return rows.map(toMember);
  }

  async findForUser(userId: string) {
    const rows = await this.prisma.projectMember.findMany({
      where: { userId, project: { archivedAt: null } },
      orderBy: { project: { name: 'asc' } },
      select: {
        projectId: true,
        projectRole: true,
        project: { select: { name: true } },
        modules: { select: { module: true } },
      },
    });
    const grants = await this.prisma.budgetAccess.findMany({
      where: { userId, projectId: { in: rows.map((row) => row.projectId) } },
      select: { projectId: true },
    });
    const granted = new Set(grants.map(({ projectId }) => projectId));

    return rows.map((row) => {
      const coordinates = row.projectRole === 'COORDINATOR';
      return {
        projectId: row.projectId,
        projectName: row.project.name,
        projectRole: row.projectRole,
        modules: coordinates
          ? [...PROJECT_SCOPED_MODULES]
          : row.modules.map(({ module }) => module),
        canEditBudget: coordinates || granted.has(row.projectId),
      };
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

      const modules: ProjectScopedModule[] = dto.modules ?? [
        ...PROJECT_SCOPED_MODULES,
      ];

      const created = await tx.projectMember.create({
        data: {
          projectId,
          userId: dto.userId,
          projectRole: dto.projectRole,
          modules: { create: modules.map((module) => ({ module })) },
        },
        include: MEMBER_INCLUDE,
      });
      return toMember(created);
    }, SERIALIZABLE);
  }

  async setRole(id: string, dto: UpdateMemberRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.projectMember.findUnique({ where: { id } });
      if (!member) {
        throw new NotFoundException('Nie znaleziono członka projektu');
      }
      await this.access.assertNotArchived(member.projectId, tx);

      if (dto.modules) {
        await tx.projectMemberModule.deleteMany({ where: { memberId: id } });
        await tx.projectMemberModule.createMany({
          data: dto.modules.map((module) => ({ memberId: id, module })),
        });
        if (!dto.modules.includes('BUDGET')) {
          await tx.budgetAccess.deleteMany({
            where: { projectId: member.projectId, userId: member.userId },
          });
        }
      }

      const updated = await tx.projectMember.update({
        where: { id },
        data: {
          projectRole: dto.projectRole,
          ...(dto.projectRole === 'PARTNER' ? {} : { partnerId: null }),
        },
        include: MEMBER_INCLUDE,
      });
      return toMember(updated);
    }, SERIALIZABLE);
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

      const updated = await tx.projectMember.update({
        where: { id },
        data: { partnerId: dto.partnerId },
        include: MEMBER_INCLUDE,
      });
      return toMember(updated);
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
      await tx.projectMemberModule.deleteMany({ where: { memberId: id } });

      await tx.projectMember.delete({ where: { id } });
    }, SERIALIZABLE);
  }
}
