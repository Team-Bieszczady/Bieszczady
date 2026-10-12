import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import { ProjectAccessService } from './project-access.service';
import { MembersService } from './members.service';

describe('MembersService', () => {
  let service: MembersService;

  const makeClient = () => ({
    project: { findUnique: jest.fn() },
    user: { findFirst: jest.fn() },
    projectMember: {
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    risk: { updateMany: jest.fn() },
    task: { updateMany: jest.fn() },
    indicator: { updateMany: jest.fn() },
    documentAccess: { deleteMany: jest.fn() },
  });

  const tx = makeClient();
  const prisma = { ...makeClient(), $transaction: jest.fn() };

  const access = new ProjectAccessService(prisma as never);

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(MembersService);
    prisma.$transaction.mockImplementation(
      (fn: (client: typeof tx) => unknown) => fn(tx),
    );
    tx.project.findUnique.mockResolvedValue({ archivedAt: null });
    tx.projectMember.findUnique.mockResolvedValue({
      id: 'm1',
      projectId: 'p1',
      userId: 'anna',
    });
  });

  describe('remove', () => {
    it('takes away the document access the person had in that project', async () => {
      await service.remove('m1');

      expect(tx.documentAccess.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'p1', userId: 'anna' },
      });
      expect(tx.projectMember.delete).toHaveBeenCalledWith({
        where: { id: 'm1' },
      });
    });

    it('does it inside the removal transaction, never outside it', async () => {
      await service.remove('m1');

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        SERIALIZABLE,
      );
      expect(prisma.documentAccess.deleteMany).not.toHaveBeenCalled();
      expect(prisma.projectMember.delete).not.toHaveBeenCalled();
    });

    it('keeps the access when the project is archived', async () => {
      tx.project.findUnique.mockResolvedValue({ archivedAt: new Date() });

      await expect(service.remove('m1')).rejects.toThrow(ForbiddenException);

      expect(tx.documentAccess.deleteMany).not.toHaveBeenCalled();
      expect(tx.projectMember.delete).not.toHaveBeenCalled();
    });

    it('refuses a member that does not exist', async () => {
      tx.projectMember.findUnique.mockResolvedValue(null);

      await expect(service.remove('m1')).rejects.toThrow(NotFoundException);

      expect(tx.documentAccess.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('add', () => {
    beforeEach(() => {
      tx.user.findFirst.mockResolvedValue({
        id: 'anna',
        accountStatus: 'ACTIVE',
      });
      tx.projectMember.count.mockResolvedValue(0);
      tx.projectMember.create.mockResolvedValue({ id: 'm2' });
    });

    it('clears shares left from an earlier membership before adding the person', async () => {
      await service.add('p1', { userId: 'anna', projectRole: 'EXECUTOR' });

      expect(tx.documentAccess.deleteMany).toHaveBeenCalledWith({
        where: { projectId: 'p1', userId: 'anna' },
      });
      expect(
        tx.documentAccess.deleteMany.mock.invocationCallOrder[0],
      ).toBeLessThan(tx.projectMember.create.mock.invocationCallOrder[0]);
      expect(prisma.documentAccess.deleteMany).not.toHaveBeenCalled();
    });

    it('clears nothing when the person is already a member', async () => {
      tx.projectMember.count.mockResolvedValue(1);

      await expect(
        service.add('p1', { userId: 'anna', projectRole: 'EXECUTOR' }),
      ).rejects.toThrow(ConflictException);

      expect(tx.documentAccess.deleteMany).not.toHaveBeenCalled();
      expect(tx.projectMember.create).not.toHaveBeenCalled();
    });
  });
});
