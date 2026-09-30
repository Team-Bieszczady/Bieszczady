import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { EventsService } from './events.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';

describe('EventsService', () => {
  let service: EventsService;

  const findMany = jest.fn<
    Promise<unknown[]>,
    [Prisma.ProjectEventFindManyArgs]
  >();
  const create = jest.fn<Promise<unknown>, [Prisma.ProjectEventCreateArgs]>();
  const taskFindMany = jest.fn<Promise<unknown[]>, [Prisma.TaskFindManyArgs]>();

  const prisma = {
    projectEvent: { findMany, create },
    task: { findMany: taskFindMany },
  };

  const access = {
    assertCanRead: jest.fn(),
    assertNotArchived: jest.fn(),
  };

  const findManyArgs = () => findMany.mock.calls[0][0];
  const createData = () =>
    create.mock.calls[0][0].data as Prisma.ProjectEventUncheckedCreateInput;

  const viewer = (isDirector: boolean): AuthenticatedUser =>
    ({ id: 'u1', isDirector }) as AuthenticatedUser;

  const row = (id: string) => ({
    id,
    source: 'MANUAL',
    content: 'Przeniesiono koncert',
    createdAt: new Date('2026-09-17T14:32:00'),
    actor: { id: 'u1', firstName: 'Anna', lastName: 'Kowalska' },
    project: { id: 'p1', name: 'Szlaki', color: 'green' },
  });

  const page = (count: number) =>
    Array.from({ length: count }, (_, index) => row(`e${index}`));

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: access },
      ],
    }).compile();

    service = module.get(EventsService);
    // Every uncursored findAll sweeps first; nothing overdue unless a test says so.
    taskFindMany.mockResolvedValue([]);
  });

  describe('findAll scoping', () => {
    it('does not restrict a director by membership', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll({}, viewer(true));

      expect(findManyArgs().where?.project).toBeUndefined();
    });

    it('restricts everyone else to the projects they belong to', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll({}, viewer(false));

      expect(findManyArgs().where?.project).toEqual({
        members: { some: { userId: 'u1' } },
      });
    });

    it('breaks ties on id so a cursor cannot skip same-timestamp rows', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll({}, viewer(true));

      expect(findManyArgs().orderBy).toEqual([
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
    });

    it('passes the project and date filters through', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll(
        { projectId: 'p1', from: '2026-09-01' },
        viewer(true),
      );

      const { where } = findManyArgs();
      expect(where?.projectId).toBe('p1');
      expect(where?.createdAt).toEqual({ gte: new Date('2026-09-01') });
    });
  });

  describe('findAll paging', () => {
    it('asks for one row beyond the page to detect more', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll({}, viewer(true));

      expect(findManyArgs().take).toBe(21);
    });

    it('trims the extra row and returns its predecessor as the cursor', async () => {
      findMany.mockResolvedValue(page(21));

      const result = await service.findAll({}, viewer(true));

      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).toBe('e19');
    });

    it('returns a null cursor on the last page', async () => {
      findMany.mockResolvedValue(page(3));

      const result = await service.findAll({}, viewer(true));

      expect(result.items).toHaveLength(3);
      expect(result.nextCursor).toBeNull();
    });

    it('skips the cursor row itself', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll({ cursor: 'e9' }, viewer(true));

      expect(findManyArgs().cursor).toEqual({ id: 'e9' });
      expect(findManyArgs().skip).toBe(1);
    });
  });

  describe('overdue sweep', () => {
    const overdue = (ownerId: string | null) => ({
      id: 't1',
      title: 'Montaż tablicy',
      dueDate: new Date('2026-09-15T00:00:00.000Z'),
      ownerId,
      activity: { stage: { projectId: 'p1' } },
    });

    it('blames the task owner, so the page prints a name like any other row', async () => {
      findMany.mockResolvedValue([]);
      taskFindMany.mockResolvedValue([overdue('piotr')]);

      await service.findAll({}, viewer(true));

      expect(createData()).toEqual({
        projectId: 'p1',
        actorId: 'piotr',
        source: 'AUTOMATIC',
        content:
          'nie ukończył(a) w terminie zadania „Montaż tablicy” (termin: 15.09.2026)',
        dedupeKey: 'overdue:t1:2026-09-15',
      });
    });

    it('writes a standalone sentence when nobody owns the task', async () => {
      findMany.mockResolvedValue([]);
      taskFindMany.mockResolvedValue([overdue(null)]);

      await service.findAll({}, viewer(true));

      expect(createData().actorId).toBeNull();
      expect(createData().content).toBe(
        'Zadanie „Montaż tablicy” przekroczyło termin realizacji (termin: 15.09.2026) — brak wykonawcy',
      );
    });

    it('ignores finished tasks and archived projects', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll({}, viewer(true));

      const { where } = taskFindMany.mock.calls[0][0];
      expect(where?.status).toEqual({ not: 'DONE' });
      expect(where?.activity).toEqual({
        stage: { project: { archivedAt: null } },
      });
    });

    it('swallows the duplicate a concurrent sweep already wrote', async () => {
      findMany.mockResolvedValue([]);
      taskFindMany.mockResolvedValue([overdue('piotr')]);
      create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.findAll({}, viewer(true))).resolves.toBeDefined();
    });

    it('does not sweep again on every page of an infinite scroll', async () => {
      findMany.mockResolvedValue([]);

      await service.findAll({ cursor: 'e9' }, viewer(true));

      expect(taskFindMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto = { projectId: 'p1', content: 'Przeniesiono koncert' };

    it('takes the actor from the token and forces MANUAL', async () => {
      create.mockResolvedValue(row('e1'));

      await service.create(dto, viewer(false));

      expect(createData().actorId).toBe('u1');
      expect(createData().source).toBe('MANUAL');
    });

    it('refuses a project the viewer is not a member of, as a 404', async () => {
      access.assertCanRead.mockRejectedValue(
        new NotFoundException('Nie znaleziono projektu'),
      );

      await expect(service.create(dto, viewer(false))).rejects.toThrow(
        NotFoundException,
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('refuses an archived project', async () => {
      access.assertNotArchived.mockRejectedValue(new ForbiddenException());

      await expect(service.create(dto, viewer(true))).rejects.toThrow(
        ForbiddenException,
      );
      expect(create).not.toHaveBeenCalled();
    });

    it('checks membership before the archive state', async () => {
      access.assertCanRead.mockRejectedValue(new NotFoundException());
      access.assertNotArchived.mockRejectedValue(new ForbiddenException());

      await expect(service.create(dto, viewer(false))).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
