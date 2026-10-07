import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListMeetingsQueryDto } from './dto/list-meetings-query.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findInRange(
    query: ListMeetingsQueryDto,
    viewer: { id: string; isDirector: boolean },
  ) {
    if (query.from > query.to) {
      throw new BadRequestException(
        'Data początkowa nie może być późniejsza niż końcowa',
      );
    }

    const visibility: Prisma.MeetingWhereInput = viewer.isDirector
      ? {}
      : {
          OR: [
            {
              project: {
                members: {
                  some: {
                    userId: viewer.id,
                    projectRole: { in: ['COORDINATOR', 'EXECUTOR'] },
                  },
                },
              },
            },
            {
              invitees: { some: { userId: viewer.id } },
              project: { members: { some: { userId: viewer.id } } },
            },
          ],
        };

    return this.prisma.meeting.findMany({
      where: {
        deletedAt: null,
        date: { gte: new Date(query.from), lte: new Date(query.to) },
        ...visibility,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        projectId: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
      },
    });
  }
}
