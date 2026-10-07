import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListMeetingsQueryDto } from './dto/list-meetings-query.dto';
import { CreateMeetingDto } from './dto/create-meeting.dto';

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
  async create(
    dto: CreateMeetingDto,
    creator: { id: string; isDirector: boolean },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: { id: true, archivedAt: true },
    });
    if (!project) throw new NotFoundException('Projekt nie istnieje');
    if (project.archivedAt)
      throw new ForbiddenException('Projekt jest zarchiwizowany');

    if (!creator.isDirector) {
      const membership = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId: dto.projectId, userId: creator.id },
        },
        select: { projectRole: true },
      });
      if (!membership || membership.projectRole === 'PARTNER') {
        throw new ForbiddenException('Nie masz uprawnień do dodawania spotkań');
      }
    }

    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException(
        'Godzina zakończenia musi być późniejsza niż rozpoczęcia',
      );
    }

    const inviteeIds = dto.inviteeIds ?? [];
    if (inviteeIds.length > 0) {
      const members = await this.prisma.projectMember.findMany({
        where: { projectId: dto.projectId, userId: { in: inviteeIds } },
        select: { userId: true },
      });
      if (members.length !== inviteeIds.length) {
        throw new BadRequestException(
          'Niektórzy zaproszeni nie są członkami projektu',
        );
      }
    }

    return this.prisma.meeting.create({
      data: {
        projectId: dto.projectId,
        title: dto.title,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        place: dto.place,
        meetingUrl: dto.meetingUrl,
        note: dto.note,
        createdById: creator.id,
        invitees:
          inviteeIds.length > 0
            ? { create: inviteeIds.map((userId) => ({ userId })) }
            : undefined,
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        place: true,
        meetingUrl: true,
        note: true,
      },
    });
  }
}
