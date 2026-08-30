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
import { ModuleAccessService } from './module-access.service';
import { DEFAULT_USER_MODULES } from '../common/enums/module.enum';
import * as bcrypt from 'bcryptjs';

interface RecordedCreate {
  data: {
    email: string;
    passwordHash: string;
    isDirector: boolean;
    accountStatus: string;
    mustChangePassword: boolean;
  };
}

interface RecordedUpdate {
  where: { id: string };
  data: { mustChangePassword: boolean };
}

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    userModuleAccess: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const auditLogMock = {
    record: jest.fn(),
    recordInTransaction: jest.fn(),
  };

  const moduleAccessMock = {
    seedDefaultModules: jest.fn(),
    setModules: jest.fn(),
    getEffectiveModules: jest.fn(),
    userHasModule: jest.fn(),
  };

  const ACTOR_ID = 'director-123';

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

  const createUserDto = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    prismaMock.$transaction.mockImplementation(
      <T>(cb: (tx: typeof prismaMock) => T | Promise<T>): Promise<T> =>
        Promise.resolve(cb(prismaMock) as T),
    );
    moduleAccessMock.seedDefaultModules.mockResolvedValue([
      ...DEFAULT_USER_MODULES,
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditLogService, useValue: auditLogMock },
        { provide: ModuleAccessService, useValue: moduleAccessMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('should create a user and never return the password hash', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      const result = await service.create(ACTOR_ID, createUserDto);

      expect(result).toEqual({
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
      expect('passwordHash' in result).toBe(false);
    });

    it('should hash the supplied password', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      await service.create(ACTOR_ID, createUserDto);

      const [createArgs] = prismaMock.user.create.mock.calls[0] as [
        RecordedCreate,
      ];
      expect(createArgs.data.passwordHash).not.toBe(createUserDto.password);
      await expect(
        bcrypt.compare(createUserDto.password, createArgs.data.passwordHash),
      ).resolves.toBe(true);
    });

    it('should normalize email to lowercase', async () => {
      prismaMock.user.create.mockResolvedValue({
        ...mockUser,
        email: 'john@example.com',
      });

      await service.create(ACTOR_ID, {
        ...createUserDto,
        email: 'JOHN@EXAMPLE.COM',
      });

      const [createArgs] = prismaMock.user.create.mock.calls[0] as [
        RecordedCreate,
      ];
      expect(createArgs.data.email).toBe('john@example.com');
    });

    it('should set isDirector to false on creation', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      await service.create(ACTOR_ID, createUserDto);

      const [createArgs] = prismaMock.user.create.mock.calls[0] as [
        RecordedCreate,
      ];
      expect(createArgs.data).toMatchObject({
        isDirector: false,
        accountStatus: 'ACTIVE',
        mustChangePassword: true,
      });
    });

    it('should seed module access inside the same transaction', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      await service.create(ACTOR_ID, {
        ...createUserDto,
        modules: ['PEOPLE'],
      });

      expect(moduleAccessMock.seedDefaultModules).toHaveBeenCalledWith(
        prismaMock,
        'user-123',
        ['PEOPLE'],
        ACTOR_ID,
      );
    });

    it('should audit the creation inside the same transaction', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);

      await service.create(ACTOR_ID, createUserDto);

      expect(auditLogMock.recordInTransaction).toHaveBeenCalledWith(
        prismaMock,
        expect.objectContaining({
          actorId: ACTOR_ID,
          targetId: 'user-123',
          action: 'USER_CREATED',
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return user excluding passwordHash', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findById('user-123');

      expect('passwordHash' in result).toBe(false);
      expect(result.id).toBe('user-123');
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should exclude soft-deleted users', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.findById('user-123')).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-123', deletedAt: null },
      });
    });
  });

  describe('updateSelf', () => {
    it('should allow user to update their own profile', async () => {
      const dto = { firstName: 'Jane' };
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      const result = await service.updateSelf('user-123', 'user-123', dto);

      expect(result.firstName).toBe('Jane');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
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
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
      });

      await service.updateSelf('user-123', 'user-123', dto);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { firstName: 'Jane', avatar: 'new.jpg' },
      });
    });

    it('should throw NotFoundException for soft-deleted user', async () => {
      const dto = { firstName: 'Jane' };
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSelf('user-123', 'user-123', dto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setAccountStatus', () => {
    it('should update account status', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        accountStatus: 'INACTIVE',
      });

      const result = await service.setAccountStatus(
        'director-123',
        'user-123',
        'INACTIVE',
      );

      expect(result.accountStatus).toBe('INACTIVE');
    });

    it('should audit the status change inside the transaction', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        accountStatus: 'INACTIVE',
      });

      await service.setAccountStatus(ACTOR_ID, 'user-123', 'INACTIVE');

      expect(auditLogMock.recordInTransaction).toHaveBeenCalledWith(
        prismaMock,
        expect.objectContaining({
          actorId: ACTOR_ID,
          targetId: 'user-123',
          action: 'ACCOUNT_DEACTIVATED',
          metadata: { from: 'ACTIVE', to: 'INACTIVE' },
        }),
      );
    });

    it('should block deactivating last active director', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      prismaMock.user.count.mockResolvedValue(1);

      await expect(
        service.setAccountStatus('director-123', 'director-123', 'INACTIVE'),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow deactivating non-director', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        accountStatus: 'INACTIVE',
      });

      const result = await service.setAccountStatus(
        ACTOR_ID,
        'user-123',
        'INACTIVE',
      );

      expect(result.accountStatus).toBe('INACTIVE');
      expect(prismaMock.user.count).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for soft-deleted user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.setAccountStatus(ACTOR_ID, 'user-123', 'INACTIVE'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDirectorStatus', () => {
    it('should promote non-director to director and audit', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        isDirector: true,
      });

      const result = await service.setDirectorStatus(
        ACTOR_ID,
        'user-123',
        true,
      );

      expect(result.isDirector).toBe(true);
      expect(auditLogMock.recordInTransaction).toHaveBeenCalledWith(
        prismaMock,
        expect.objectContaining({
          action: 'DIRECTOR_STATUS_GRANTED',
        }),
      );
      expect(prismaMock.user.count).not.toHaveBeenCalled();
    });

    it('should reject self-revocation of director status', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockDirector);

      await expect(
        service.setDirectorStatus('director-123', 'director-123', false),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should block demoting last active director', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      prismaMock.user.count.mockResolvedValue(1);

      await expect(
        service.setDirectorStatus('other-director', 'director-123', false),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow demoting director when others exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      prismaMock.user.count.mockResolvedValue(2);
      prismaMock.user.update.mockResolvedValue({
        ...mockDirector,
        isDirector: false,
      });

      const result = await service.setDirectorStatus(
        'other-director',
        'director-123',
        false,
      );

      expect(result.isDirector).toBe(false);
      expect(auditLogMock.recordInTransaction).toHaveBeenCalledWith(
        prismaMock,
        expect.objectContaining({
          action: 'DIRECTOR_STATUS_REVOKED',
        }),
      );
    });

    it('should throw NotFoundException for soft-deleted user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.setDirectorStatus('actor', 'user-123', true),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeOwnPassword', () => {
    it('should change password on correct current password', async () => {
      const currentHash = await bcrypt.hash('OldPass123!', 10);
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockUser,
        passwordHash: currentHash,
      });
      prismaMock.user.update.mockResolvedValue(mockUser);

      await service.changeOwnPassword('user-123', {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456!',
      });

      const [updateArgs] = prismaMock.user.update.mock.calls[0] as [
        RecordedUpdate,
      ];
      expect(updateArgs.where).toEqual({ id: 'user-123' });
      expect(updateArgs.data.mustChangePassword).toBe(false);
    });

    it('should reject incorrect current password', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
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
      prismaMock.user.findFirst.mockResolvedValue(null);

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
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await service.softDeleteUser(ACTOR_ID, 'user-123');

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: { deletedAt: expect.any(Date) as Date },
        }),
      );
    });

    it('should audit the deletion inside the transaction', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await service.softDeleteUser(ACTOR_ID, 'user-123');

      expect(auditLogMock.recordInTransaction).toHaveBeenCalledWith(
        prismaMock,
        expect.objectContaining({
          actorId: ACTOR_ID,
          targetId: 'user-123',
          action: 'ACCOUNT_DELETED',
        }),
      );
    });

    it('should block deleting last active director', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        ...mockDirector,
        accountStatus: 'ACTIVE',
      });
      prismaMock.user.count.mockResolvedValue(1);

      await expect(
        service.softDeleteUser('other-director', 'director-123'),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow deleting non-director', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
      });

      await service.softDeleteUser(ACTOR_ID, 'user-123');

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(prismaMock.user.count).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for already-deleted user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.softDeleteUser(ACTOR_ID, 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setModuleAccess', () => {
    it('should delegate to ModuleAccessService', async () => {
      moduleAccessMock.setModules.mockResolvedValue(['OVERVIEW', 'PEOPLE']);

      const result = await service.setModuleAccess(ACTOR_ID, 'user-123', [
        'OVERVIEW',
        'PEOPLE',
      ]);

      expect(moduleAccessMock.setModules).toHaveBeenCalledWith(
        ACTOR_ID,
        'user-123',
        ['OVERVIEW', 'PEOPLE'],
      );
      expect(result).toEqual(['OVERVIEW', 'PEOPLE']);
    });
  });
});
