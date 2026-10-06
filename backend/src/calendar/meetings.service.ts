import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListMeetingsQueryDto } from './dto/list-meetings-query.dto';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findInRange(query: ListMeetingsQueryDto) {
    if (query.from > query.to) {
      throw new BadRequestException(
        'Data początkowa nie może być późniejsza niż końcowa',
      );
    }

    return this.prisma.meeting.findMany({
      where: {
        deletedAt: null,
        date: { gte: new Date(query.from), lte: new Date(query.to) },
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
