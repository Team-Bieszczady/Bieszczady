import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ParticipantsService } from './participants.service';

describe('ParticipantsService', () => {
  let service: ParticipantsService;

  const prisma = { participant: { findMany: jest.fn() } };

  const findManyArgs = () => {
    const [args] = prisma.participant.findMany.mock.calls[0] as [
      { where: unknown; orderBy: unknown },
    ];
    return args;
  };

  const matching = (word: string) => ({
    OR: [
      { firstName: { contains: word } },
      { lastName: { contains: word } },
      { email: { contains: word } },
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
  });

  describe('findAll', () => {
    it('lists only participants that were not deleted, by last and first name', async () => {
      await service.findAll({});

      expect(findManyArgs()).toMatchObject({
        where: { deletedAt: null, AND: [] },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      });
    });

    it('needs every searched word to match a first name, last name or email', async () => {
      await service.findAll({ search: 'Jan  Kowal' });

      expect(findManyArgs().where).toEqual({
        deletedAt: null,
        AND: [matching('Jan'), matching('Kowal')],
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
          consentAt: null,
          meetingCount: 3,
        },
      ]);
    });
  });
});
