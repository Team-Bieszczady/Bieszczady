import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  Module,
  MODULES,
  DEFAULT_USER_MODULES,
  isModule,
} from '../common/enums/module.enum';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class ModuleAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getEffectiveModules(user: {
    id: string;
    isDirector: boolean;
  }): Promise<Module[]> {
    if (user.isDirector) {
      return [...MODULES];
    }

    const grants = await this.prisma.userModuleAccess.findMany({
      where: { userId: user.id },
      select: { module: true },
    });

    return grants.map((g) => g.module).filter(isModule);
  }

  async userHasModule(userId: string, module: Module): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        isDirector: true,
        moduleAccess: { where: { module }, select: { id: true } },
      },
    });

    if (!user) {
      return false;
    }

    return user.isDirector || user.moduleAccess.length > 0;
  }

  async seedDefaultModules(
    tx: Prisma.TransactionClient,
    userId: string,
    extra: Module[],
    grantedById: string,
  ): Promise<Module[]> {
    const modulesToGrant = Array.from(
      new Set([...DEFAULT_USER_MODULES, ...extra]),
    );

    await tx.userModuleAccess.createMany({
      data: modulesToGrant.map((module) => ({
        userId,
        module,
        grantedById,
      })),
    });

    return modulesToGrant;
  }

  async setModules(
    actorId: string,
    targetId: string,
    modules: Module[],
  ): Promise<Module[]> {
    return this.prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findFirst({
          where: { id: targetId, deletedAt: null },
          select: { id: true },
        });

        if (!target) {
          throw new NotFoundException('User not found');
        }

        const currentGrants = await tx.userModuleAccess.findMany({
          where: { userId: targetId },
          select: { module: true },
        });

        const currentModules = new Set(
          currentGrants.map((g) => g.module).filter(isModule),
        );
        const requestedModules = new Set(modules);

        const toRemove = Array.from(currentModules).filter(
          (m) => !requestedModules.has(m),
        );
        const toAdd = Array.from(requestedModules).filter(
          (m) => !currentModules.has(m),
        );

        if (toRemove.length > 0) {
          await tx.userModuleAccess.deleteMany({
            where: {
              userId: targetId,
              module: { in: toRemove },
            },
          });
        }

        if (toAdd.length > 0) {
          await tx.userModuleAccess.createMany({
            data: toAdd.map((module) => ({
              userId: targetId,
              module,
              grantedById: actorId,
            })),
          });
        }

        await this.auditLog.recordInTransaction(tx, {
          actorId,
          targetId,
          action: 'MODULE_ACCESS_UPDATED',
          metadata: { added: toAdd, removed: toRemove },
        });

        return Array.from(requestedModules);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
