import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingsService } from './meetings.service';

describe('MeetingsService', () => {
  let service: MeetingsService;

  const prisma = { meeting: { findMany: jest.fn() } };

  const october = { from: '2026-10-01', to: '2026-10-31' };
  const inOctober = {
    deletedAt: null,
    date: { gte: new Date('2026-10-01'), lte: new Date('2026-10-31') },
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
  });

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
    await service.findInRange(october, { id: 'director-1', isDirector: true });

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
