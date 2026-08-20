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
import { User, Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  private excludePasswordHash(user: User): Omit<User, 'passwordHash'> {
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => key !== 'passwordHash'),
    ) as Omit<User, 'passwordHash'>;
  }

  private generateTempPassword(): string {
    return randomBytes(16).toString('base64url');
  }

  private async setPassword(
    userId: string,
    plainPassword: string,
  ): Promise<void> {
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
    tx: PrismaClient,
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

  async create(dto: CreateUserDto): Promise<{
    user: Omit<User, 'passwordHash'>;
    tempPassword: string;
  }> {
    const tempPassword = this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const normalizedEmail = this.normalizeEmail(dto.email);

    try {
      const user = await this.prisma.user.create({
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

      return {
        user: this.excludePasswordHash(user),
        tempPassword,
      };
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
          await this.assertNotLastActiveDirector(
            tx as PrismaClient,
            user,
            'deactivate',
          );
        }

        return tx.user.update({
          where: { id },
          data: { accountStatus: status },
        });
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
          await this.assertNotLastActiveDirector(
            tx as PrismaClient,
            target,
            'remove',
          );
        }

        const updated = await tx.user.update({
          where: { id: targetId },
          data: { isDirector },
        });

        return { updated, previousIsDirector: target.isDirector };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.auditLog.record({
      actorId,
      targetId,
      action: isDirector
        ? 'DIRECTOR_STATUS_GRANTED'
        : 'DIRECTOR_STATUS_REVOKED',
      metadata: {
        previousValue: result.previousIsDirector,
        newValue: isDirector,
      },
    });

    return this.excludePasswordHash(result.updated);
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
  }

  async softDeleteUser(id: string): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findFirst({
          where: { id, deletedAt: null },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        await this.assertNotLastActiveDirector(
          tx as PrismaClient,
          user,
          'delete',
        );

        await tx.user.update({
          where: { id },
          data: { deletedAt: new Date() },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
