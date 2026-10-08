import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';

const LIST_FIELDS = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  consentAt: true,
  _count: {
    select: { meetings: { where: { meeting: { deletedAt: null } } } },
  },
} satisfies Prisma.ParticipantSelect;

@Injectable()
export class ParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListParticipantsQueryDto) {
    const participants = await this.prisma.participant.findMany({
      where: { deletedAt: null, AND: this.matchingEveryWord(query.search) },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: LIST_FIELDS,
    });

    return participants.map(({ _count, ...participant }) => ({
      ...participant,
      meetingCount: _count.meetings,
    }));
  }

  private matchingEveryWord(
    search: string | undefined,
  ): Prisma.ParticipantWhereInput[] {
    const words = search?.split(/\s+/).filter(Boolean) ?? [];

    return words.map((word) => ({
      OR: [
        { firstName: { contains: word } },
        { lastName: { contains: word } },
        { email: { contains: word } },
      ],
    }));
  }
}
