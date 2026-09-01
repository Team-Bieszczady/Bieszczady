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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditLogService } from './audit-log.service';
import { ModuleAccessService } from './module-access.service';
import { Module } from '../common/enums/module.enum';

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
    action: string,
  ): Promise<void> {
    if (user.isDirector && user.accountStatus === 'ACTIVE') {
      const activeDirectorCount = await tx.user.count({
        where: { isDirector: true, accountStatus: 'ACTIVE', deletedAt: null },
      });
      if (activeDirectorCount <= 1) {
        throw new ConflictException(
          `Cannot ${action} the last remaining active director`,
        );
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
        const grantedModules = await this.moduleAccess.seedDefaultModules(
          tx,
          newUser.id,
          dto.modules ?? [],
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
          throw new ConflictException('Email already in use');
        }
      }
      throw new InternalServerErrorException();
    }
  }

  async findById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.excludePasswordHash(user);
  }

  async findByEmail(email: string): Promise<Omit<User, 'passwordHash'> | null> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    return user ? this.excludePasswordHash(user) : null;
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
  async findAll(includeDeleted = false): Promise<Omit<User, 'passwordHash'>[]> {
    const users = await this.prisma.user.findMany({
      where: includeDeleted ? {} : { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    return users.map((user) => this.excludePasswordHash(user));
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
      throw new ForbiddenException('You can only edit your own profile');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: targetId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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
    const updated = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findFirst({
          where: { id, deletedAt: null },
        });

        if (!user) {
          throw new NotFoundException('User not found');
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return this.excludePasswordHash(updated);
  }

  async setDirectorStatus(
    actorId: string,
    targetId: string,
    isDirector: boolean,
  ): Promise<Omit<User, 'passwordHash'>> {
    const result = await this.prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findFirst({
          where: { id: targetId, deletedAt: null },
        });

        if (!target) {
          throw new NotFoundException('User not found');
        }

        if (actorId === targetId && !isDirector) {
          throw new ForbiddenException(
            'A director cannot revoke their own director status',
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

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
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.setPassword(userId, dto.newPassword);
    await this.auditLog.record({
      actorId: userId,
      targetId: userId,
      action: 'PASSWORD_CHANGED',
    });
  }

  async softDeleteUser(actorId: string, id: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findFirst({
          where: { id, deletedAt: null },
        });

        if (!user) {
          throw new NotFoundException('User not found');
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async setModuleAccess(
    actorId: string,
    targetId: string,
    modules: Module[],
  ): Promise<Module[]> {
    return this.moduleAccess.setModules(actorId, targetId, modules);
  }
}
