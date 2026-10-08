import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MeetingsService } from './meetings.service';
import { isoDay, todayInPoland } from './dates';

type Viewer = { id: string; isDirector: boolean };

@Injectable()
export class MeetingParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meetings: MeetingsService,
  ) {}

  async list(meetingId: string, viewer: Viewer) {
    await this.meetings.findManageable(meetingId, viewer, { readOnly: true });

    const rows = await this.prisma.meetingParticipant.findMany({
      where: { meetingId, participant: { deletedAt: null } },
      orderBy: [
        { participant: { lastName: 'asc' } },
        { participant: { firstName: 'asc' } },
      ],
      select: {
        participant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            consentAt: true,
          },
        },
      },
    });

    return rows.map((row) => row.participant);
  }

  async add(meetingId: string, participantId: string, viewer: Viewer) {
    const meeting = await this.meetings.findManageable(meetingId, viewer);
    this.assertAttendanceCanBeRecorded(meeting);

    const participant = await this.prisma.participant.findFirst({
      where: { id: participantId, deletedAt: null },
      select: { id: true },
    });
    if (!participant) {
      throw new NotFoundException('Nie znaleziono uczestnika');
    }

    const alreadyAdded = await this.prisma.meetingParticipant.findUnique({
      where: { meetingId_participantId: { meetingId, participantId } },
      select: { id: true },
    });
    if (alreadyAdded) {
      return;
    }

    await this.prisma.meetingParticipant.create({
      data: { meetingId, participantId },
    });
  }

  async remove(meetingId: string, participantId: string, viewer: Viewer) {
    await this.meetings.findManageable(meetingId, viewer);

    await this.prisma.meetingParticipant.deleteMany({
      where: { meetingId, participantId },
    });
  }

  private assertAttendanceCanBeRecorded(meeting: {
    date: Date;
    status: string;
  }) {
    if (meeting.status === 'CANCELLED') {
      throw new BadRequestException(
        'Do odwołanego spotkania nie można dopisać uczestników',
      );
    }

    if (isoDay(meeting.date) > todayInPoland()) {
      throw new BadRequestException(
        'Uczestników można dopisać dopiero w dniu spotkania',
      );
    }
  }
}
