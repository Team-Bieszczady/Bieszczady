import { randomUUID } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { StorageService } from '../documents/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import {
  ATTENDANCE_FILE_FIELDS,
  ATTENDANCE_FOLDER_NAME,
  toAttendanceFile,
} from './attendance-files';
import { MeetingsService } from './meetings.service';
import { isoDay, todayInPoland } from './dates';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

function attendanceDocumentName(
  meeting: { title: string; date: Date },
  filesSoFar: number,
) {
  const [year, month, day] = isoDay(meeting.date).split('-');
  const name = `Lista obecności – ${meeting.title} – ${day}.${month}.${year}`;
  return filesSoFar === 0 ? name : `${name} (${filesSoFar + 1})`;
}

@Injectable()
export class MeetingAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly projectAccess: ProjectAccessService,
    private readonly meetings: MeetingsService,
  ) {}

  async upload(
    meetingId: string,
    file: UploadedFile | undefined,
    actor: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('Nie wybrano pliku');

    const meeting = await this.meetings.findManageable(meetingId, actor);
    if (meeting.status === 'CANCELLED') {
      throw new BadRequestException(
        'Do odwołanego spotkania nie można dodać listy obecności',
      );
    }
    if (isoDay(meeting.date) > todayInPoland()) {
      throw new BadRequestException(
        'Listę obecności można dodać dopiero w dniu spotkania',
      );
    }

    const folderId = await this.attendanceFolderId(meeting.projectId, actor.id);
    const approves = await this.projectAccess.canManageTasks(
      actor,
      meeting.projectId,
    );
    const filesSoFar = await this.prisma.meetingAttendanceFile.count({
      where: { meetingId },
    });

    const documentId = randomUUID();
    const storageKey = `${meeting.projectId}/${documentId}/v1`;
    await this.storage.save(storageKey, file.buffer, file.mimetype);

    const saved = await this.prisma.meetingAttendanceFile
      .create({
        data: {
          meeting: { connect: { id: meetingId } },
          document: {
            create: {
              id: documentId,
              projectId: meeting.projectId,
              folderId,
              name: attendanceDocumentName(meeting, filesSoFar),
              kind: 'ATTENDANCE_LIST',
              status: approves ? 'APPROVED' : 'PENDING_APPROVAL',
              ownerId: actor.id,
              versions: {
                create: {
                  versionNo: 1,
                  storageKey,
                  fileName: file.originalname,
                  mimeType: file.mimetype,
                  sizeBytes: file.size,
                  uploadedById: actor.id,
                },
              },
            },
          },
        },
        select: ATTENDANCE_FILE_FIELDS,
      })
      .catch(async (error: unknown) => {
        await this.storage.remove(storageKey).catch(() => undefined);
        throw error;
      });

    return toAttendanceFile(saved);
  }

  async download(meetingId: string, fileId: string, actor: AuthenticatedUser) {
    await this.meetings.findManageable(meetingId, actor, { readOnly: true });
    const file = await this.findFile(meetingId, fileId);

    return {
      buffer: await this.storage.read(file.storageKey),
      fileName: file.fileName,
      mimeType: file.mimeType,
    };
  }

  async remove(meetingId: string, fileId: string, actor: AuthenticatedUser) {
    await this.meetings.findManageable(meetingId, actor);
    const file = await this.findFile(meetingId, fileId);

    const locked = file.status === 'APPROVED' || file.status === 'SIGNED';
    if (locked && !actor.isDirector) {
      throw new ForbiddenException(
        'Zatwierdzoną listę obecności może usunąć tylko dyrektor',
      );
    }

    await this.prisma.document.update({
      where: { id: file.documentId },
      data: { deletedAt: new Date() },
    });
  }

  private async attendanceFolderId(projectId: string, ownerId: string) {
    const existing = await this.prisma.folder.findFirst({
      where: {
        projectId,
        parentId: null,
        name: ATTENDANCE_FOLDER_NAME,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.folder.create({
      data: { projectId, name: ATTENDANCE_FOLDER_NAME, ownerId },
      select: { id: true },
    });
    return created.id;
  }

  private async findFile(meetingId: string, fileId: string) {
    const file = await this.prisma.meetingAttendanceFile.findFirst({
      where: { id: fileId, meetingId, document: { deletedAt: null } },
      select: {
        documentId: true,
        document: {
          select: {
            status: true,
            versions: {
              orderBy: { versionNo: 'desc' },
              take: 1,
              select: { storageKey: true, fileName: true, mimeType: true },
            },
          },
        },
      },
    });

    const latest = file?.document.versions[0];
    if (!file || !latest) throw new NotFoundException('Nie znaleziono pliku');

    return {
      documentId: file.documentId,
      status: file.document.status,
      ...latest,
    };
  }
}
