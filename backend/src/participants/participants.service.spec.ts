import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ParticipantsService } from './participants.service';

describe('ParticipantsService', () => {
  let service: ParticipantsService;

  const prisma = {
    participant: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  };

  const person = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: '',
    phone: '',
    address: '',
    hasConsent: false,
  };

  const savedData = (mock: jest.Mock) => {
    const [args] = mock.mock.calls[0] as [{ data: Record<string, unknown> }];
    return args.data;
  };

  const findManyArgs = () => {
    const [args] = prisma.participant.findMany.mock.calls[0] as [
      { where: unknown; orderBy: unknown },
    ];
    return args;
  };

  const matching = (word: string) => ({
    OR: [
      { firstName: { startsWith: word } },
      { lastName: { startsWith: word } },
      { lastName: { contains: `-${word}` } },
      { email: { startsWith: word } },
    ],
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ParticipantsService);
    prisma.participant.findMany.mockResolvedValue([]);
    prisma.participant.findFirst.mockResolvedValue({ consentAt: null });
    prisma.participant.create.mockResolvedValue({});
    prisma.participant.update.mockResolvedValue({});
  });

  describe('create', () => {
    it('saves empty optional fields as blank and records who added the person', async () => {
      await service.create(person, 'user-1');

      expect(savedData(prisma.participant.create)).toEqual({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: null,
        phone: null,
        address: null,
        note: '',
        consentAt: null,
        createdById: 'user-1',
      });
    });

    it('records the day consent was given', async () => {
      await service.create({ ...person, hasConsent: true }, 'user-1');

      expect(savedData(prisma.participant.create).consentAt).toBeInstanceOf(
        Date,
      );
    });
  });

  describe('update', () => {
    const consentedOn = new Date('2026-09-01');

    it('answers 404 for a person who does not exist or was deleted', async () => {
      prisma.participant.findFirst.mockResolvedValue(null);

      await expect(service.update('participant-1', person)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.participant.update).not.toHaveBeenCalled();
    });

    it('keeps the original consent date while consent stays', async () => {
      prisma.participant.findFirst.mockResolvedValue({
        consentAt: consentedOn,
      });

      await service.update('participant-1', { ...person, hasConsent: true });

      expect(savedData(prisma.participant.update).consentAt).toBe(consentedOn);
    });

    it('records today when consent is given now', async () => {
      await service.update('participant-1', { ...person, hasConsent: true });

      expect(savedData(prisma.participant.update).consentAt).toBeInstanceOf(
        Date,
      );
    });

    it('clears the consent when it is withdrawn', async () => {
      prisma.participant.findFirst.mockResolvedValue({
        consentAt: consentedOn,
      });

      await service.update('participant-1', person);

      expect(savedData(prisma.participant.update).consentAt).toBeNull();
    });
  });

  describe('remove', () => {
    it('hides the person instead of erasing them', async () => {
      await service.remove('participant-1');

      expect(savedData(prisma.participant.update).deletedAt).toBeInstanceOf(
        Date,
      );
    });

    it('answers 404 for a person who does not exist or was deleted', async () => {
      prisma.participant.findFirst.mockResolvedValue(null);

      await expect(service.remove('participant-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.participant.update).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('lists only participants that were not deleted, by last and first name', async () => {
      await service.findAll({});

      expect(findManyArgs()).toMatchObject({
        where: { deletedAt: null, AND: [] },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    });

    it('matches the start of a name or email and the second part of a double surname', async () => {
      await service.findAll({ search: 'Kow' });

      expect(findManyArgs().where).toEqual({
        deletedAt: null,
        AND: [
          {
            OR: [
              { firstName: { startsWith: 'Kow' } },
              { lastName: { startsWith: 'Kow' } },
              { lastName: { contains: '-Kow' } },
              { email: { startsWith: 'Kow' } },
            ],
          },
        ],
      });
    });

    it('needs every searched word to match a first name, last name or email', async () => {
      await service.findAll({ search: 'Jan  Kowal' });

      expect(findManyArgs().where).toEqual({
        deletedAt: null,
        AND: [matching('Jan'), matching('Kowal')],
      });
    });

    it('counts only meetings that were not deleted or cancelled', async () => {
      await service.findAll({});

      expect(findManyArgs()).toMatchObject({
        select: {
          _count: {
            select: {
              meetings: {
                where: {
                  meeting: { deletedAt: null, status: { not: 'CANCELLED' } },
                },
              },
            },
          },
        },
      });
    });

    it('tells how many meetings each person attended', async () => {
      prisma.participant.findMany.mockResolvedValue([
        {
          id: 'participant-1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: null,
          phone: null,
          address: 'Lesko, ul. Bieszczadzka 1',
          note: '',
          consentAt: null,
          _count: { meetings: 3 },
        },
      ]);

      await expect(service.findAll({})).resolves.toEqual([
        {
          id: 'participant-1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: null,
          phone: null,
          address: 'Lesko, ul. Bieszczadzka 1',
          note: '',
          consentAt: null,
          meetingCount: 3,
        },
      ]);
    });
  });

  describe('findDuplicates', () => {
    it('answers nothing when neither an email nor a full name is given', async () => {
      await expect(
        service.findDuplicates({ firstName: 'Jan' }),
      ).resolves.toEqual([]);
      expect(prisma.participant.findMany).not.toHaveBeenCalled();
    });

    it('matches by email or by first and last name together', async () => {
      prisma.participant.findMany.mockResolvedValue([]);

      await service.findDuplicates({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@poczta.pl',
      });

      expect(findManyArgs()).toMatchObject({
        where: {
          deletedAt: null,
          id: undefined,
          OR: [
            { email: 'jan@poczta.pl' },
            { firstName: 'Jan', lastName: 'Kowalski' },
          ],
        },
      });
    });

    it('excludes the person being edited', async () => {
      prisma.participant.findMany.mockResolvedValue([]);

      await service.findDuplicates({
        email: 'jan@poczta.pl',
        excludeId: 'participant-1',
      });

      expect(findManyArgs().where).toMatchObject({
        id: { not: 'participant-1' },
      });
    });

    it('does not match on a first name alone', async () => {
      await expect(
        service.findDuplicates({ firstName: 'Jan', lastName: undefined }),
      ).resolves.toEqual([]);
      expect(prisma.participant.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findByProject', () => {
    it('answers 404 for a project that does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.findByProject('project-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.participant.findMany).not.toHaveBeenCalled();
    });

    it('lists people who attended a meeting of the project, with how many', async () => {
      prisma.project.findUnique.mockResolvedValue({ name: 'Szlak rowerowy' });
      prisma.participant.findMany.mockResolvedValue([
        {
          id: 'participant-1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: null,
          phone: null,
          address: 'Lesko',
          _count: { meetings: 2 },
        },
      ]);

      await expect(service.findByProject('project-1')).resolves.toEqual({
        projectName: 'Szlak rowerowy',
        participants: [
          {
            id: 'participant-1',
            firstName: 'Jan',
            lastName: 'Kowalski',
            email: null,
            phone: null,
            address: 'Lesko',
            meetingCount: 2,
          },
        ],
      });

      expect(findManyArgs()).toMatchObject({
        where: {
          deletedAt: null,
          meetings: {
            some: {
              meeting: {
                deletedAt: null,
                status: { not: 'CANCELLED' },
                projectId: 'project-1',
              },
            },
          },
        },
      });
    });
  });
});
