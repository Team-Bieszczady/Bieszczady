import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ModuleAccessService } from './module-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { MODULES } from '../common/enums/module.enum';

describe('ModuleAccessService', () => {
  let service: ModuleAccessService;
  let prisma: PrismaService;
  let recordInTransaction: jest.Mock;

  const prismaMock = {
    user: {
      findFirst: jest.fn(),
    },
    userModuleAccess: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.$transaction.mockImplementation(
      <T>(cb: (tx: typeof prismaMock) => T | Promise<T>): Promise<T> =>
        Promise.resolve(cb(prismaMock) as T),
    );
    recordInTransaction = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModuleAccessService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: AuditLogService,
          useValue: { record: jest.fn(), recordInTransaction },
        },
      ],
    }).compile();

    service = module.get<ModuleAccessService>(ModuleAccessService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('getEffectiveModules', () => {
    it('gives a director every module without querying grants', async () => {
      const result = await service.getEffectiveModules({
        id: '1',
        isDirector: true,
      });

      expect(result).toEqual([...MODULES]);
      expect(prismaMock.userModuleAccess.findMany).not.toHaveBeenCalled();
    });

    it('returns granted modules and drops rows outside MODULES', async () => {
      prismaMock.userModuleAccess.findMany.mockResolvedValue([
        { module: 'PEOPLE' },
        { module: 'RETIRED_MODULE' },
        { module: 'TASKS' },
      ]);

      const result = await service.getEffectiveModules({
        id: '1',
        isDirector: false,
      });

      expect(result).toEqual(['PEOPLE', 'TASKS']);
    });
  });

  describe('userHasModule', () => {
    it('resolves in a single query', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        isDirector: false,
        moduleAccess: [{ id: 'grant-1' }],
      });

      await expect(service.userHasModule('1', 'PEOPLE')).resolves.toBe(true);
      expect(prismaMock.user.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: '1', deletedAt: null },
        select: {
          isDirector: true,
          moduleAccess: { where: { module: 'PEOPLE' }, select: { id: true } },
        },
      });
    });

    it('is true for a director with no grants', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        isDirector: true,
        moduleAccess: [],
      });

      await expect(service.userHasModule('1', 'PEOPLE')).resolves.toBe(true);
    });

    it('is false for a non-director without the grant', async () => {
      prismaMock.user.findFirst.mockResolvedValue({
        isDirector: false,
        moduleAccess: [],
      });

      await expect(service.userHasModule('1', 'PEOPLE')).resolves.toBe(false);
    });

    it('is false for a missing or soft-deleted user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(service.userHasModule('1', 'PEOPLE')).resolves.toBe(false);
    });
  });

  describe('setModules', () => {
    it('throws NotFoundException when the target does not exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.setModules('actor-1', 'ghost', ['PEOPLE']),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.userModuleAccess.createMany).not.toHaveBeenCalled();
    });

    it('adds and removes only what changed', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prismaMock.userModuleAccess.findMany.mockResolvedValue([
        { module: 'OVERVIEW' },
        { module: 'TASKS' },
      ]);

      const result = await service.setModules('actor-1', 'user-1', [
        'OVERVIEW',
        'PEOPLE',
      ]);

      expect(prismaMock.userModuleAccess.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', module: { in: ['TASKS'] } },
      });
      expect(prismaMock.userModuleAccess.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-1', module: 'PEOPLE', grantedById: 'actor-1' }],
      });
      expect(result).toEqual(['OVERVIEW', 'PEOPLE']);
    });

    it('skips both writes when nothing changed', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prismaMock.userModuleAccess.findMany.mockResolvedValue([
        { module: 'OVERVIEW' },
      ]);

      await service.setModules('actor-1', 'user-1', ['OVERVIEW']);

      expect(prismaMock.userModuleAccess.deleteMany).not.toHaveBeenCalled();
      expect(prismaMock.userModuleAccess.createMany).not.toHaveBeenCalled();
    });

    it('reads, diffs and writes inside one transaction, auditing the diff', async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prismaMock.userModuleAccess.findMany.mockResolvedValue([
        { module: 'TASKS' },
      ]);

      await service.setModules('actor-1', 'user-1', ['PEOPLE']);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(recordInTransaction).toHaveBeenCalledWith(prismaMock, {
        actorId: 'actor-1',
        targetId: 'user-1',
        action: 'MODULE_ACCESS_UPDATED',
        metadata: { added: ['PEOPLE'], removed: ['TASKS'] },
      });
    });
  });

  describe('seedDefaultModules', () => {
    it('grants the defaults plus any extras, deduplicated', async () => {
      const granted = await service.seedDefaultModules(
        prisma,
        'user-1',
        ['TASKS', 'PEOPLE'],
        'actor-1',
      );

      expect(granted).toEqual(['OVERVIEW', 'TASKS', 'CALENDAR', 'PEOPLE']);
      expect(prismaMock.userModuleAccess.createMany).toHaveBeenCalledWith({
        data: granted.map((module) => ({
          userId: 'user-1',
          module,
          grantedById: 'actor-1',
        })),
      });
    });
  });
});
