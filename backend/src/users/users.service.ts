import {
  Injectable,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditLogService } from './audit-log.service';
import { ModuleAccessService } from './module-access.service';
import { Module } from '../common/enums/module.enum';

const TASK_COUNT = { _count: { select: { ownedTasks: true } } } as const;

type UserWithCount = User & { _count: { ownedTasks: number } };

export type UserWithTaskCount = Omit<User, 'passwordHash'> & {
  taskCount: number;
};

const LAST_DIRECTOR_MESSAGES = {
  deactivate: 'Nie można dezaktywować ostatniego aktywnego dyrektora',
  remove: 'Nie można odebrać uprawnień ostatniemu aktywnemu dyrektorowi',
  delete: 'Nie można usunąć ostatniego aktywnego dyrektora',
} as const;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly moduleAccess: ModuleAccessService,
  ) {}

  private excludePasswordHash(user: User): Omit<User, 'passwordHash'> {
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== 'passwordHash'),
    ) as Omit<User, 'passwordHash'>;
  }
  private withTaskCount(user: UserWithCount): UserWithTaskCount {
    const { _count, ...row } = user;

    return { ...this.excludePasswordHash(row), taskCount: _count.ownedTasks };
  }

  async setPassword(userId: string, plainPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async assertNotLastActiveDirector(
    tx: Prisma.TransactionClient,
    user: User,
    action: 'deactivate' | 'remove' | 'delete',
  ): Promise<void> {
    if (user.isDirector && user.accountStatus === 'ACTIVE') {
      const activeDirectorCount = await tx.user.count({
        where: { isDirector: true, accountStatus: 'ACTIVE', deletedAt: null },
      });
      if (activeDirectorCount <= 1) {
        throw new ConflictException(LAST_DIRECTOR_MESSAGES[action]);
      }
    }
  }

  async create(
    actorId: string,
    dto: CreateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const normalizedEmail = this.normalizeEmail(dto.email);

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: normalizedEmail,
            phone: dto.phone,
            passwordHash,
            isDirector: false,
            accountStatus: 'ACTIVE',
            mustChangePassword: true,
          },
        });
        const grantedModules = await this.moduleAccess.grantInitialModules(
          tx,
          newUser.id,
          dto.modules,
          actorId,
        );

        await this.auditLog.recordInTransaction(tx, {
          actorId,
          targetId: newUser.id,
          action: 'USER_CREATED',
          metadata: { email: newUser.email, modules: grantedModules },
        });

        return newUser;
      });

      return this.excludePasswordHash(user);
    } catch (error) {
      this.logger.error('Error creating user:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Ten adres e-mail jest już zajęty');
        }
      }
      throw new InternalServerErrorException('Wystąpił błąd serwera');
    }
  }

  async findById(id: string): Promise<UserWithTaskCount> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: TASK_COUNT,
    });

    if (!user) {
      throw new NotFoundException('Nie znaleziono użytkownika');
    }

    return this.withTaskCount(user);
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);

    return this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });
  }

  async findByIdForAuth(
    id: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    return user ? this.excludePasswordHash(user) : null;
  }
  async findAll(includeDeleted = false): Promise<UserWithTaskCount[]> {
    const users = await this.prisma.user.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: TASK_COUNT,
    });

    return users.map((user) => this.withTaskCount(user));
  }

  async recordLogin(id: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { lastLogin: new Date() },
    });
  }

  async updateSelf(
    actorId: string,
    targetId: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    if (actorId !== targetId) {
      throw new ForbiddenException('Możesz edytować tylko własny profil');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Nie znaleziono użytkownika');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data,
    });

    return this.excludePasswordHash(updated);
  }

  async setAccountStatus(
    actorId: string,
    id: string,
    status: string,
  ): Promise<Omit<User, 'passwordHash'>> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException('Nie znaleziono użytkownika');
      }

      if (actorId === id) {
        throw new ForbiddenException(
          'Nie możesz zmienić statusu własnego konta',
        );
      }

      if (status === 'INACTIVE') {
        await this.assertNotLastActiveDirector(tx, user, 'deactivate');
      }

      const result = await tx.user.update({
        where: { id },
        data: { accountStatus: status },
      });

      await this.auditLog.recordInTransaction(tx, {
        actorId,
        targetId: id,
        action:
          status === 'INACTIVE' ? 'ACCOUNT_DEACTIVATED' : 'ACCOUNT_ACTIVATED',
        metadata: { from: user.accountStatus, to: status },
      });

      return result;
    }, SERIALIZABLE);

    return this.excludePasswordHash(updated);
  }

  async setDirectorStatus(
    actorId: string,
    targetId: string,
    isDirector: boolean,
  ): Promise<Omit<User, 'passwordHash'>> {
    const result = await this.prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({
        where: { id: targetId, deletedAt: null },
      });

      if (!target) {
        throw new NotFoundException('Nie znaleziono użytkownika');
      }

      if (actorId === targetId && !isDirector) {
        throw new ForbiddenException(
          'Nie możesz odebrać sobie uprawnień dyrektora',
        );
      }

      if (!isDirector && target.isDirector) {
        await this.assertNotLastActiveDirector(tx, target, 'remove');
      }

      const updated = await tx.user.update({
        where: { id: targetId },
        data: { isDirector },
      });

      await this.auditLog.recordInTransaction(tx, {
        actorId,
        targetId,
        action: isDirector
          ? 'DIRECTOR_STATUS_GRANTED'
          : 'DIRECTOR_STATUS_REVOKED',
        metadata: {
          previousValue: target.isDirector,
          newValue: isDirector,
        },
      });

      return updated;
    }, SERIALIZABLE);

    return this.excludePasswordHash(result);
  }

  async changeOwnPassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('Nie znaleziono użytkownika');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Obecne hasło jest nieprawidłowe');
    }

    await this.setPassword(userId, dto.newPassword);
    await this.auditLog.record({
      actorId: userId,
      targetId: userId,
      action: 'PASSWORD_CHANGED',
    });
  }

  async softDeleteUser(actorId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id, deletedAt: null },
      });

      if (!user) {
        throw new NotFoundException('Nie znaleziono użytkownika');
      }

      if (actorId === id) {
        throw new ForbiddenException('Nie możesz usunąć własnego konta');
      }

      await this.assertNotLastActiveDirector(tx, user, 'delete');

      await tx.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await this.auditLog.recordInTransaction(tx, {
        actorId,
        targetId: id,
        action: 'ACCOUNT_DELETED',
        metadata: { email: user.email },
      });
    }, SERIALIZABLE);
  }
  async getModuleAccess(id: string): Promise<{ modules: Module[] }> {
    const user = await this.findById(id);

    return {
      modules: await this.moduleAccess.getEffectiveModules({
        id: user.id,
        isDirector: user.isDirector,
      }),
    };
  }

  async setModuleAccess(
    actorId: string,
    targetId: string,
    modules: Module[],
  ): Promise<Module[]> {
    return this.moduleAccess.setModules(actorId, targetId, modules);
  }
}
