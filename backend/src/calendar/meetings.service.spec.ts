import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingsService } from './meetings.service';

describe('MeetingsService', () => {
  let service: MeetingsService;

  const prisma = {
    meeting: { findMany: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    projectMember: { findUnique: jest.fn(), findMany: jest.fn() },
  };

  const october = { from: '2026-10-01', to: '2026-10-31' };
  const inOctober = {
    deletedAt: null,
    date: { gte: new Date('2026-10-01'), lte: new Date('2026-10-31') },
  };

  const executor = { id: 'executor-1', isDirector: false };
  const storedMeeting = {
    projectId: 'project-1',
    createdById: 'author-1',
    project: { archivedAt: null },
  };
  const changes = {
    title: 'Rada gminy',
    date: '2026-10-20',
    startTime: '10:00',
    endTime: '11:00',
    inviteeIds: ['member-1'],
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(MeetingsService);
    prisma.meeting.findMany.mockResolvedValue([]);
    prisma.meeting.findFirst.mockResolvedValue(storedMeeting);
    prisma.meeting.update.mockResolvedValue({});
    prisma.projectMember.findMany.mockResolvedValue([{ userId: 'member-1' }]);
  });

  describe('findInRange', () => {
    it('rejects a range that ends before it starts, without asking the database', async () => {
      await expect(
        service.findInRange(
          { from: '2026-10-31', to: '2026-10-01' },
          { id: 'user-1', isDirector: false },
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.meeting.findMany).not.toHaveBeenCalled();
    });

    it('shows a director every meeting in the range', async () => {
      await service.findInRange(october, {
        id: 'director-1',
        isDirector: true,
      });

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: inOctober }),
      );
    });

    it('shows anyone else the meetings of projects they coordinate or carry out, and meetings they are invited to while on the team', async () => {
      await service.findInRange(october, { id: 'user-1', isDirector: false });

      expect(prisma.meeting.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ...inOctober,
            OR: [
              {
                project: {
                  members: {
                    some: {
                      userId: 'user-1',
                      projectRole: { in: ['COORDINATOR', 'EXECUTOR'] },
                    },
                  },
                },
              },
              {
                invitees: { some: { userId: 'user-1' } },
                project: { members: { some: { userId: 'user-1' } } },
              },
            ],
          },
        }),
      );
    });
  });

  describe('update', () => {
    it('answers 404 for a meeting the person cannot see', async () => {
      prisma.meeting.findFirst.mockResolvedValue(null);

      await expect(
        service.update('meeting-1', changes, executor),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });

    it('refuses an executor who did not add the meeting', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'EXECUTOR',
      });

      await expect(
        service.update('meeting-1', changes, executor),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });

    it('refuses changes in an archived project', async () => {
      prisma.meeting.findFirst.mockResolvedValue({
        ...storedMeeting,
        project: { archivedAt: new Date() },
      });

      await expect(
        service.update('meeting-1', changes, {
          id: 'director-1',
          isDirector: true,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets the executor who added the meeting change it', async () => {
      prisma.meeting.findFirst.mockResolvedValue({
        ...storedMeeting,
        createdById: executor.id,
      });
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'EXECUTOR',
      });

      await service.update('meeting-1', changes, executor);

      expect(prisma.meeting.update).toHaveBeenCalled();
    });

    it('lets a coordinator replace the invitee list and clear empty optional fields', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'COORDINATOR',
      });

      await service.update('meeting-1', changes, {
        id: 'coordinator-1',
        isDirector: false,
      });

      const [updateArgs] = prisma.meeting.update.mock.calls[0] as [
        { where: unknown; data: unknown },
      ];
      expect(updateArgs.where).toEqual({ id: 'meeting-1' });
      expect(updateArgs.data).toMatchObject({
        place: null,
        meetingUrl: null,
        note: '',
        invitees: {
          deleteMany: {},
          create: [{ userId: 'member-1' }],
        },
      });
    });

    it('rejects invitees from outside the project team', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'COORDINATOR',
      });
      prisma.projectMember.findMany.mockResolvedValue([]);

      await expect(
        service.update('meeting-1', changes, {
          id: 'coordinator-1',
          isDirector: false,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });
  });

  describe('setOutcome', () => {
    const coordinator = { id: 'coordinator-1', isDirector: false };
    const pastMeeting = { ...storedMeeting, date: new Date('2020-05-04') };
    const futureMeeting = { ...storedMeeting, date: new Date('2099-05-04') };

    const savedData = () => {
      const [updateArgs] = prisma.meeting.update.mock.calls[0] as [
        { data: Record<string, unknown> },
      ];
      return updateArgs.data;
    };

    beforeEach(() => {
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'COORDINATOR',
      });
    });

    it('records who confirmed a held meeting and how many people came', async () => {
      prisma.meeting.findFirst.mockResolvedValue(pastMeeting);

      await service.setOutcome(
        'meeting-1',
        { status: 'HELD', attendeeCount: 18 },
        coordinator,
      );

      expect(savedData()).toMatchObject({
        status: 'HELD',
        attendeeCount: 18,
        confirmedById: 'coordinator-1',
      });
      expect(savedData().confirmedAt).toBeInstanceOf(Date);
    });

    it('needs the number of people for a held meeting', async () => {
      prisma.meeting.findFirst.mockResolvedValue(pastMeeting);

      await expect(
        service.setOutcome('meeting-1', { status: 'HELD' }, coordinator),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });

    it('does not let a future meeting be marked as held', async () => {
      prisma.meeting.findFirst.mockResolvedValue(futureMeeting);

      await expect(
        service.setOutcome(
          'meeting-1',
          { status: 'HELD', attendeeCount: 5 },
          coordinator,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });

    it('lets a future meeting be cancelled and drops any head count', async () => {
      prisma.meeting.findFirst.mockResolvedValue(futureMeeting);

      await service.setOutcome(
        'meeting-1',
        { status: 'CANCELLED', attendeeCount: 7 },
        coordinator,
      );

      expect(savedData()).toMatchObject({
        status: 'CANCELLED',
        attendeeCount: null,
      });
    });
  });

  describe('remove', () => {
    it('hides the meeting instead of erasing it', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'COORDINATOR',
      });

      await service.remove('meeting-1', {
        id: 'coordinator-1',
        isDirector: false,
      });

      const [updateArgs] = prisma.meeting.update.mock.calls[0] as [
        { where: unknown; data: { deletedAt: unknown } },
      ];
      expect(updateArgs.where).toEqual({ id: 'meeting-1' });
      expect(updateArgs.data.deletedAt).toBeInstanceOf(Date);
    });

    it('refuses an executor who did not add the meeting', async () => {
      prisma.projectMember.findUnique.mockResolvedValue({
        projectRole: 'EXECUTOR',
      });

      await expect(service.remove('meeting-1', executor)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });

    it('answers 404 for a meeting the person cannot see', async () => {
      prisma.meeting.findFirst.mockResolvedValue(null);

      await expect(service.remove('meeting-1', executor)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.meeting.update).not.toHaveBeenCalled();
    });
  });
});
