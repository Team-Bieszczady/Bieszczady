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
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingOutcomeDto } from './dto/meeting-outcome.dto';
import { isoDay, todayInPoland } from './dates';
import { ATTENDANCE_FILE_FIELDS, toAttendanceFile } from './attendance-files';

type Viewer = { id: string; isDirector: boolean };

const ORGANIZER_ROLES = ['COORDINATOR', 'EXECUTOR'];

const SAVED_MEETING_FIELDS = {
  id: true,
  projectId: true,
  title: true,
  date: true,
  startTime: true,
  endTime: true,
  place: true,
  meetingUrl: true,
  note: true,
  status: true,
  attendeeCount: true,
  confirmedAt: true,
} satisfies Prisma.MeetingSelect;

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findInRange(query: ListMeetingsQueryDto, viewer: Viewer) {
    if (query.from > query.to) {
      throw new BadRequestException(
        'Data początkowa nie może być późniejsza niż końcowa',
      );
    }

    return this.prisma.meeting.findMany({
      where: {
        deletedAt: null,
        date: { gte: new Date(query.from), lte: new Date(query.to) },
        ...this.visibleTo(viewer),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      select: {
        id: true,
        projectId: true,
        title: true,
        date: true,
        startTime: true,
        endTime: true,
        place: true,
        status: true,
      },
    });
  }

  async projectOptions(viewer: Viewer) {
    return this.prisma.project.findMany({
      where: {
        archivedAt: null,
        ...(viewer.isDirector
          ? {}
          : {
              members: {
                some: {
                  userId: viewer.id,
                  projectRole: { in: ORGANIZER_ROLES },
                },
              },
            }),
      },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  async findOne(id: string, viewer: Viewer) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, deletedAt: null, ...this.visibleTo(viewer) },
      select: {
        ...SAVED_MEETING_FIELDS,
        createdAt: true,
        project: { select: { name: true, archivedAt: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        confirmedBy: { select: { firstName: true, lastName: true } },
        invitees: {
          select: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        attendanceFiles: {
          where: { document: { deletedAt: null } },
          select: ATTENDANCE_FILE_FIELDS,
        },
      },
    });

    if (!meeting) {
      throw new NotFoundException('Nie znaleziono spotkania');
    }

    const isManager = await this.canManage(
      { projectId: meeting.projectId, createdById: meeting.createdBy.id },
      viewer,
    );

    return {
      ...meeting,
      attendanceFiles: isManager
        ? meeting.attendanceFiles.map((file) => toAttendanceFile(file, viewer))
        : [],
      canManage: isManager && !meeting.project.archivedAt,
    };
  }

  async create(dto: CreateMeetingDto, creator: Viewer) {
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
      if (!membership || !ORGANIZER_ROLES.includes(membership.projectRole)) {
        throw new ForbiddenException('Nie masz uprawnień do dodawania spotkań');
      }
    }

    this.assertEndsAfterStart(dto);

    const inviteeIds = dto.inviteeIds ?? [];
    await this.assertInviteesOnTeam(dto.projectId, inviteeIds);

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
        invitees: { create: inviteeIds.map((userId) => ({ userId })) },
      },
      select: SAVED_MEETING_FIELDS,
    });
  }

  async update(id: string, dto: UpdateMeetingDto, editor: Viewer) {
    const meeting = await this.findManageable(id, editor);

    this.assertEndsAfterStart(dto);

    const inviteeIds = dto.inviteeIds ?? [];
    await this.assertInviteesOnTeam(meeting.projectId, inviteeIds);

    return this.prisma.meeting.update({
      where: { id },
      data: {
        title: dto.title,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        place: dto.place || null,
        meetingUrl: dto.meetingUrl || null,
        note: dto.note ?? '',
        invitees: {
          deleteMany: {},
          create: inviteeIds.map((userId) => ({ userId })),
        },
      },
      select: SAVED_MEETING_FIELDS,
    });
  }

  async setOutcome(id: string, dto: MeetingOutcomeDto, editor: Viewer) {
    const meeting = await this.findManageable(id, editor);
    const held = dto.status === 'HELD';

    if (held && isoDay(meeting.date) > todayInPoland()) {
      throw new BadRequestException(
        'Spotkanie można oznaczyć jako odbyte dopiero w dniu, w którym się odbywa',
      );
    }
    if (held && dto.attendeeCount === undefined) {
      throw new BadRequestException('Podaj, ile osób przyszło na spotkanie');
    }

    return this.prisma.meeting.update({
      where: { id },
      data: {
        status: dto.status,
        attendeeCount: held ? dto.attendeeCount : null,
        confirmedAt: new Date(),
        confirmedById: editor.id,
      },
      select: SAVED_MEETING_FIELDS,
    });
  }

  async remove(id: string, editor: Viewer) {
    await this.findManageable(id, editor);

    await this.prisma.meeting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findManageable(
    id: string,
    viewer: Viewer,
    { readOnly = false }: { readOnly?: boolean } = {},
  ) {
    const meeting = await this.prisma.meeting.findFirst({
      where: { id, deletedAt: null, ...this.visibleTo(viewer) },
      select: {
        projectId: true,
        title: true,
        date: true,
        status: true,
        createdById: true,
        project: { select: { archivedAt: true } },
      },
    });
    if (!meeting) throw new NotFoundException('Nie znaleziono spotkania');
    if (meeting.project.archivedAt && !readOnly)
      throw new ForbiddenException('Projekt jest zarchiwizowany');

    if (!(await this.canManage(meeting, viewer))) {
      throw new ForbiddenException(
        'Spotkanie może zmienić lub usunąć dyrektor, koordynator projektu albo osoba, która je dodała',
      );
    }

    return meeting;
  }

  private visibleTo(viewer: Viewer): Prisma.MeetingWhereInput {
    if (viewer.isDirector) return {};

    return {
      OR: [
        {
          project: {
            members: {
              some: {
                userId: viewer.id,
                projectRole: { in: ORGANIZER_ROLES },
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
  }

  private async canManage(
    meeting: { projectId: string; createdById: string },
    viewer: Viewer,
  ) {
    if (viewer.isDirector) return true;

    const membership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: meeting.projectId, userId: viewer.id },
      },
      select: { projectRole: true },
    });

    if (membership?.projectRole === 'COORDINATOR') return true;
    return (
      membership?.projectRole === 'EXECUTOR' &&
      meeting.createdById === viewer.id
    );
  }

  private assertEndsAfterStart(times: { startTime: string; endTime: string }) {
    if (times.startTime >= times.endTime) {
      throw new BadRequestException(
        'Godzina zakończenia musi być późniejsza niż rozpoczęcia',
      );
    }
  }

  private async assertInviteesOnTeam(projectId: string, inviteeIds: string[]) {
    if (inviteeIds.length === 0) return;

    const members = await this.prisma.projectMember.findMany({
      where: { projectId, userId: { in: inviteeIds } },
      select: { userId: true },
    });
    if (members.length !== inviteeIds.length) {
      throw new BadRequestException(
        'Niektórzy zaproszeni nie są członkami projektu',
      );
    }
  }
}
