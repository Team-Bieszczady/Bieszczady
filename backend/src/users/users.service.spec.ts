/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let auditLog: AuditLogService;

  const mockUser = {
    id: 'user-123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: null,
    passwordHash: '$2a$10$hashedpassword',
    avatar: null,
    accountStatus: 'ACTIVE',
    isDirector: false,
    mustChangePassword: true,
    lastLogin: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    deletedAt: null,
  };

  const mockDirector = {
    ...mockUser,
    id: 'director-123',
    isDirector: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            record: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    auditLog = module.get<AuditLogService>(AuditLogService);
  });

  describe('create', () => {
    it('should create a user with generated temp password', async () => {
      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result.user).toEqual({
        id: 'user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: null,
        avatar: null,
        accountStatus: 'ACTIVE',
        isDirector: false,
        mustChangePassword: true,
        lastLogin: null,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        deletedAt: null,
      });
      expect('passwordHash' in result.user).toBe(false);
      expect(result.tempPassword).toBeTruthy();
      expect(result.tempPassword.length).toBeGreaterThan(0);
    });

    it('should normalize email to lowercase', async () => {
      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'JOHN@EXAMPLE.COM',
      };

      const createSpy = jest.spyOn(prisma.user, 'create').mockResolvedValue({
        ...mockUser,
        email: 'john@example.com',
      });

      await service.create(createUserDto);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'john@example.com',
          }),
        }),
      );
    });

    it('should set isDirector to false on creation', async () => {
      const createUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const createSpy = jest
        .spyOn(prisma.user, 'create')
        .mockResolvedValue(mockUser);

      await service.create(createUserDto);

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDirector: false,
            accountStatus: 'ACTIVE',
            mustChangePassword: true,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return user excluding passwordHash', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect('passwordHash' in result).toBe(false);
      expect(result.id).toBe('user-123');
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should exclude soft-deleted users', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(service.findById('user-123')).rejects.toThrow(
        NotFoundException,
      );

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
      });
    });
  });

  describe('updateSelf', () => {
    it('should allow user to update their own profile', async () => {
      const dto = { firstName: 'Jane' };
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      const result = await service.updateSelf('user-123', 'user-123', dto);

      expect(result.firstName).toBe('Jane');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firstName: 'Jane' },
      });
    });

    it('should reject updates from different actor', async () => {
      const dto = { firstName: 'Jane' };

      await expect(
        service.updateSelf('actor-123', 'user-123', dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only include allow-listed fields in update', async () => {
      const dto = { firstName: 'Jane', avatar: 'new.jpg' };
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      const updateSpy = jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      await service.updateSelf('user-123', 'user-123', dto);

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firstName: 'Jane', avatar: 'new.jpg' },
      });
    });

    it('should throw NotFoundException for soft-deleted user', async () => {
      const dto = { firstName: 'Jane' };
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(
        service.updateSelf('user-123', 'user-123', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setAccountStatus', () => {
    it('should update account status', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        accountStatus: 'INACTIVE',
      });

      const result = await service.setAccountStatus('user-123', 'INACTIVE');

      expect(result.accountStatus).toBe('INACTIVE');
    });

    it('should block deactivating last active director', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      await expect(
        service.setAccountStatus('director-123', 'INACTIVE'),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow deactivating non-director', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        accountStatus: 'INACTIVE',
      });

      const result = await service.setAccountStatus('user-123', 'INACTIVE');

      expect(result.accountStatus).toBe('INACTIVE');
      expect(prisma.user.count).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for soft-deleted user', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(
        service.setAccountStatus('user-123', 'INACTIVE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDirectorStatus', () => {
    it('should promote non-director to director and audit', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        isDirector: true,
      });
      jest.spyOn(auditLog, 'record').mockResolvedValue(undefined);

      const result = await service.setDirectorStatus(
        'director-123',
        'user-123',
        true,
      );

      expect(result.isDirector).toBe(true);
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DIRECTOR_STATUS_GRANTED',
        }),
      );
      expect(prisma.user.count).not.toHaveBeenCalled();
    });

    it('should reject self-revocation of director status', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockDirector);

      await expect(
        service.setDirectorStatus('director-123', 'director-123', false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should block demoting last active director', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      await expect(
        service.setDirectorStatus('other-director', 'director-123', false),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow demoting director when others exist', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      jest.spyOn(prisma.user, 'count').mockResolvedValue(2);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockDirector,
        isDirector: false,
      });
      jest.spyOn(auditLog, 'record').mockResolvedValue(undefined);

      const result = await service.setDirectorStatus(
        'other-director',
        'director-123',
        false,
      );

      expect(result.isDirector).toBe(false);
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DIRECTOR_STATUS_REVOKED',
        }),
      );
    });

    it('should throw NotFoundException for soft-deleted user', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(
        service.setDirectorStatus('actor', 'user-123', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeOwnPassword', () => {
    it('should change password on correct current password', async () => {
      const currentHash = await bcrypt.hash('OldPass123!', 10);
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({
        ...mockUser,
        passwordHash: currentHash,
      });
      jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser);

      await service.changeOwnPassword('user-123', {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456!',
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: expect.objectContaining({
            mustChangePassword: false,
          }),
        }),
      );
    });

    it('should reject incorrect current password', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({
        ...mockUser,
        passwordHash: '$2a$10$hashedpassword',
      });

      await expect(
        service.changeOwnPassword('user-123', {
          currentPassword: 'WrongPass123!',
          newPassword: 'NewPass456!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException for soft-deleted user', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(
        service.changeOwnPassword('user-123', {
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass456!',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteUser', () => {
    it('should set deletedAt on user', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await service.softDeleteUser('user-123');

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });

    it('should block deleting last active director', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      await expect(service.softDeleteUser('director-123')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should allow deleting non-director', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await service.softDeleteUser('user-123');

      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.user.count).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for already-deleted user', async () => {
      jest.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);

      await expect(service.softDeleteUser('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
