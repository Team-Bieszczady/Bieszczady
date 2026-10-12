import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingParticipantsService } from './meeting-participants.service';
import { MeetingsService } from './meetings.service';

describe('MeetingParticipantsService', () => {
  let service: MeetingParticipantsService;

  const prisma = {
    meetingParticipant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    participant: { findFirst: jest.fn() },
  };
  const meetings = { findManageable: jest.fn(), visibleTo: jest.fn() };

  const coordinator = { id: 'coordinator-1', isDirector: false };
  const pastMeeting = { date: new Date('2020-05-04'), status: 'HELD' };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingParticipantsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MeetingsService, useValue: meetings },
      ],
    }).compile();

    service = module.get(MeetingParticipantsService);
    meetings.findManageable.mockResolvedValue(pastMeeting);
    prisma.meetingParticipant.findMany.mockResolvedValue([]);
    prisma.meetingParticipant.findUnique.mockResolvedValue(null);
    prisma.participant.findFirst.mockResolvedValue({ id: 'participant-1' });
    prisma.meetingParticipant.count.mockResolvedValue(0);
    meetings.visibleTo.mockReturnValue({});
  });

  describe('list', () => {
    it('lists the people on the meeting', async () => {
      prisma.meetingParticipant.findMany.mockResolvedValue([
        {
          participant: {
            id: 'participant-1',
            firstName: 'Jan',
            lastName: 'Kowalski',
            email: null,
            consentAt: null,
          },
        },
      ]);

      await expect(service.list('meeting-1', coordinator)).resolves.toEqual([
        {
          id: 'participant-1',
          firstName: 'Jan',
          lastName: 'Kowalski',
          email: null,
          consentAt: null,
        },
      ]);
    });

    it('leaves out people who were deleted from the base', async () => {
      await service.list('meeting-1', coordinator);

      const [args] = prisma.meetingParticipant.findMany.mock.calls[0] as [
        { where: unknown },
      ];
      expect(args.where).toEqual({
        meetingId: 'meeting-1',
        participant: { deletedAt: null },
      });
    });
  });

  describe('add', () => {
    it('adds the person to the meeting', async () => {
      await service.add('meeting-1', 'participant-1', coordinator);

      expect(prisma.meetingParticipant.create).toHaveBeenCalledWith({
        data: { meetingId: 'meeting-1', participantId: 'participant-1' },
      });
    });

    it('does nothing when the person is already on the meeting', async () => {
      prisma.meetingParticipant.findUnique.mockResolvedValue({ id: 'link-1' });

      await service.add('meeting-1', 'participant-1', coordinator);

      expect(prisma.meetingParticipant.create).not.toHaveBeenCalled();
    });

    it('answers 404 for a person who does not exist or was deleted', async () => {
      prisma.participant.findFirst.mockResolvedValue(null);

      await expect(
        service.add('meeting-1', 'participant-1', coordinator),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.meetingParticipant.create).not.toHaveBeenCalled();
    });

    it('refuses a cancelled meeting', async () => {
      meetings.findManageable.mockResolvedValue({
        ...pastMeeting,
        status: 'CANCELLED',
      });

      await expect(
        service.add('meeting-1', 'participant-1', coordinator),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.meetingParticipant.create).not.toHaveBeenCalled();
    });

    it('refuses a meeting that has not happened yet', async () => {
      meetings.findManageable.mockResolvedValue({
        date: new Date('2099-05-04'),
        status: 'PLANNED',
      });

      await expect(
        service.add('meeting-1', 'participant-1', coordinator),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.meetingParticipant.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('takes the person off the meeting', async () => {
      await service.remove('meeting-1', 'participant-1', coordinator);

      expect(prisma.meetingParticipant.deleteMany).toHaveBeenCalledWith({
        where: { meetingId: 'meeting-1', participantId: 'participant-1' },
      });
    });
  });

  describe('history', () => {
    const storedMeeting = {
      id: 'meeting-1',
      title: 'Warsztat',
      date: new Date('2026-10-05'),
      startTime: '12:00',
      endTime: '13:00',
      status: 'HELD',
      project: { name: 'Warsztaty ekologiczne' },
    };

    it('answers 404 for someone who is not in the base', async () => {
      prisma.participant.findFirst.mockResolvedValue(null);

      await expect(
        service.history('participant-1', coordinator),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.meetingParticipant.findMany).not.toHaveBeenCalled();
    });

    it('lists the meetings the viewer may see, newest first', async () => {
      meetings.visibleTo.mockReturnValue({ OR: [] });
      prisma.meetingParticipant.count.mockResolvedValue(1);
      prisma.meetingParticipant.findMany.mockResolvedValue([
        { meeting: storedMeeting },
      ]);

      const result = await service.history('participant-1', coordinator);

      expect(meetings.visibleTo).toHaveBeenCalledWith(coordinator);
      expect(prisma.meetingParticipant.count).toHaveBeenCalledWith({
        where: {
          participantId: 'participant-1',
          meeting: { deletedAt: null, status: { not: 'CANCELLED' } },
        },
      });
      expect(prisma.meetingParticipant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            participantId: 'participant-1',
            meeting: {
              deletedAt: null,
              status: { not: 'CANCELLED' },
              OR: [],
            },
          },
          orderBy: [
            { meeting: { date: 'desc' } },
            { meeting: { startTime: 'desc' } },
          ],
        }),
      );
      expect(result).toEqual({
        meetings: [
          {
            id: 'meeting-1',
            title: 'Warsztat',
            date: new Date('2026-10-05'),
            startTime: '12:00',
            endTime: '13:00',
            status: 'HELD',
            projectName: 'Warsztaty ekologiczne',
          },
        ],
        hiddenCount: 0,
      });
    });

    it('counts meetings from projects the viewer cannot see without naming them', async () => {
      prisma.meetingParticipant.count.mockResolvedValue(3);
      prisma.meetingParticipant.findMany.mockResolvedValue([
        { meeting: storedMeeting },
      ]);

      const result = await service.history('participant-1', coordinator);

      expect(result.meetings).toHaveLength(1);
      expect(result.hiddenCount).toBe(2);
    });
  });
});
