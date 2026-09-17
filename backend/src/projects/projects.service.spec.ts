import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from './project-access.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService date order', () => {
  let service: ProjectsService;

  const prisma = {
    project: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };

  const access = {
    assertCanRead: jest.fn(),
    assertExists: jest.fn(),
    assertNotArchived: jest.fn(),
  };

  const stored = (startDate: Date | null, plannedEndDate: Date | null) => ({
    id: 'p1',
    name: 'Projekt',
    description: '',
    statusId: null,
    color: 'green',
    budgetAmount: null,
    startDate,
    plannedEndDate,
    archivedAt: null,
    status: null,
    types: [],
    recipients: [],
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(ProjectsService);
    prisma.project.update.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        ...stored(null, null),
        ...data,
      }),
    );
  });

  describe('create', () => {
    it('refuses a start after the planned end', async () => {
      await expect(
        service.create({
          name: 'Projekt',
          startDate: '2026-12-01',
          plannedEndDate: '2026-01-01',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('allows a start equal to the planned end', async () => {
      prisma.$transaction.mockResolvedValue(stored(null, null));

      await service.create({
        name: 'Projekt',
        startDate: '2026-01-01',
        plannedEndDate: '2026-01-01',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('allows a project with only one of the two dates', async () => {
      prisma.$transaction.mockResolvedValue(stored(null, null));

      await service.create({ name: 'Projekt', startDate: '2026-01-01' });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('compares a moved start against the date already stored', async () => {
      prisma.project.findUnique.mockResolvedValue(
        stored(new Date('2026-01-01'), new Date('2026-06-01')),
      );

      await expect(
        service.update('p1', { startDate: '2026-12-01' }),
      ).rejects.toThrow(ConflictException);

      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('compares a moved end against the date already stored', async () => {
      prisma.project.findUnique.mockResolvedValue(
        stored(new Date('2026-06-01'), new Date('2026-12-01')),
      );

      await expect(
        service.update('p1', { plannedEndDate: '2026-01-01' }),
      ).rejects.toThrow(ConflictException);
    });

    it('accepts a move that keeps the pair in order', async () => {
      prisma.project.findUnique.mockResolvedValue(
        stored(new Date('2026-01-01'), new Date('2026-06-01')),
      );

      await service.update('p1', { plannedEndDate: '2026-08-01' });

      expect(prisma.project.update).toHaveBeenCalled();
    });

    it('leaves an unrelated edit alone on a row whose dates are already out of order', async () => {
      prisma.project.findUnique.mockResolvedValue(
        stored(new Date('2026-12-01'), new Date('2026-01-01')),
      );

      await service.update('p1', { name: 'Nowa nazwa' });

      expect(prisma.project.update).toHaveBeenCalled();
    });

    it('clears a date when null is sent, which can never be out of order', async () => {
      prisma.project.findUnique.mockResolvedValue(
        stored(new Date('2026-12-01'), new Date('2026-01-01')),
      );

      await service.update('p1', { startDate: null });

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { startDate: null } }),
      );
    });

    it('still 404s before any date check', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update('p1', { startDate: '2026-12-01' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archived projects are read-only', () => {
    const archived = () =>
      access.assertNotArchived.mockRejectedValue(
        new ForbiddenException('This project is archived'),
      );

    it('refuses an edit, before touching the row', async () => {
      prisma.project.findUnique.mockResolvedValue(stored(null, null));
      archived();

      await expect(service.update('p1', { name: 'Nowa' })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('refuses a status change', async () => {
      prisma.project.findUnique.mockResolvedValue(stored(null, null));
      archived();

      await expect(service.setStatus('p1', { statusId: null })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('answers "archived" before "dates out of order"', async () => {
      prisma.project.findUnique.mockResolvedValue(stored(null, null));
      archived();

      await expect(
        service.update('p1', {
          startDate: '2026-12-01',
          plannedEndDate: '2026-01-01',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('the three exits stay open on an archived project', () => {
    it('archives without consulting the archived gate', async () => {
      prisma.project.findUnique.mockResolvedValue(stored(null, null));

      await service.setArchived('p1', true);

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { archivedAt: expect.any(Date) as Date },
        }),
      );
      expect(access.assertNotArchived).not.toHaveBeenCalled();
    });

    it('restores without consulting the archived gate', async () => {
      prisma.project.findUnique.mockResolvedValue(stored(null, null));

      await service.setArchived('p1', false);

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { archivedAt: null } }),
      );
      expect(access.assertNotArchived).not.toHaveBeenCalled();
    });

    it('still refuses to delete a project that has not been archived', async () => {
      prisma.$transaction.mockImplementation(
        (fn: (tx: typeof prisma) => unknown) => fn(prisma),
      );
      prisma.project.findUnique.mockResolvedValue({
        id: 'p1',
        archivedAt: null,
      });

      await expect(service.remove('p1')).rejects.toThrow(ConflictException);
      expect(access.assertNotArchived).not.toHaveBeenCalled();
    });
  });
});
