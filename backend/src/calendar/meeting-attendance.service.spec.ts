import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { StorageService } from '../documents/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { MeetingAttendanceService } from './meeting-attendance.service';
import { MeetingsService } from './meetings.service';

describe('MeetingAttendanceService', () => {
  let service: MeetingAttendanceService;

  const prisma = {
    meetingAttendanceFile: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    folder: { findFirst: jest.fn(), create: jest.fn() },
    document: { update: jest.fn() },
  };
  const storage = { save: jest.fn(), read: jest.fn(), remove: jest.fn() };
  const projectAccess = { canManageTasks: jest.fn() };
  const meetings = { findManageable: jest.fn() };

  const user = { id: 'user-1', isDirector: false } as AuthenticatedUser;
  const director = { id: 'director-1', isDirector: true } as AuthenticatedUser;
  const scan = {
    buffer: Buffer.from('scan'),
    originalname: 'lista.pdf',
    mimetype: 'application/pdf',
    size: 4,
  };
  const heldMeeting = {
    projectId: 'project-1',
    title: 'Rada gminy',
    date: new Date('2020-08-20'),
    status: 'HELD',
  };
  const storedFile = {
    documentId: 'document-1',
    document: {
      status: 'APPROVED',
      versions: [
        {
          storageKey: 'project-1/document-1/v1',
          fileName: 'lista.pdf',
          mimeType: 'application/pdf',
        },
      ],
    },
  };

  const createdDocument = () => {
    const [args] = prisma.meetingAttendanceFile.create.mock.calls[0] as [
      { data: { document: { create: Record<string, unknown> } } },
    ];
    return args.data.document.create;
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingAttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: ProjectAccessService, useValue: projectAccess },
        { provide: MeetingsService, useValue: meetings },
      ],
    }).compile();

    service = module.get(MeetingAttendanceService);
    meetings.findManageable.mockResolvedValue(heldMeeting);
    prisma.folder.findFirst.mockResolvedValue({ id: 'folder-1' });
    prisma.meetingAttendanceFile.count.mockResolvedValue(0);
    prisma.meetingAttendanceFile.create.mockResolvedValue({
      id: 'file-1',
      document: { name: 'x', versions: [] },
    });
    prisma.meetingAttendanceFile.findFirst.mockResolvedValue(storedFile);
  });

  describe('upload', () => {
    it('refuses a cancelled meeting without storing anything', async () => {
      meetings.findManageable.mockResolvedValue({
        ...heldMeeting,
        status: 'CANCELLED',
      });

      await expect(service.upload('meeting-1', scan, user)).rejects.toThrow(
        BadRequestException,
      );
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('refuses a meeting that has not happened yet', async () => {
      meetings.findManageable.mockResolvedValue({
        ...heldMeeting,
        date: new Date('2099-08-20'),
      });

      await expect(service.upload('meeting-1', scan, user)).rejects.toThrow(
        BadRequestException,
      );
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('creates the attendance folder when the project has none and waits for approval of an executor upload', async () => {
      prisma.folder.findFirst.mockResolvedValue(null);
      prisma.folder.create.mockResolvedValue({ id: 'new-folder' });
      projectAccess.canManageTasks.mockResolvedValue(false);

      await service.upload('meeting-1', scan, user);

      expect(prisma.folder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            projectId: 'project-1',
            name: 'Listy obecności',
            ownerId: 'user-1',
          },
        }),
      );
      expect(createdDocument()).toMatchObject({
        folderId: 'new-folder',
        name: 'Lista obecności – Rada gminy – 20.08.2020',
        kind: 'ATTENDANCE_LIST',
        status: 'PENDING_APPROVAL',
      });
    });

    it('reuses the folder, numbers further scans and approves a coordinator upload', async () => {
      prisma.meetingAttendanceFile.count.mockResolvedValue(1);
      projectAccess.canManageTasks.mockResolvedValue(true);

      await service.upload('meeting-1', scan, user);

      expect(prisma.folder.create).not.toHaveBeenCalled();
      expect(createdDocument()).toMatchObject({
        folderId: 'folder-1',
        name: 'Lista obecności – Rada gminy – 20.08.2020 (2)',
        status: 'APPROVED',
      });
    });

    it('removes the stored file when saving to the database fails', async () => {
      projectAccess.canManageTasks.mockResolvedValue(true);
      prisma.meetingAttendanceFile.create.mockRejectedValue(new Error('db'));
      storage.remove.mockResolvedValue(undefined);

      await expect(service.upload('meeting-1', scan, user)).rejects.toThrow(
        'db',
      );
      const [savedKey] = storage.save.mock.calls[0] as [string];
      expect(storage.remove).toHaveBeenCalledWith(savedKey);
    });
  });

  describe('download', () => {
    it('lets managers read scans even in an archived project', async () => {
      storage.read.mockResolvedValue(Buffer.from('scan'));

      const result = await service.download('meeting-1', 'file-1', user);

      expect(meetings.findManageable).toHaveBeenCalledWith('meeting-1', user, {
        readOnly: true,
      });
      expect(storage.read).toHaveBeenCalledWith('project-1/document-1/v1');
      expect(result.fileName).toBe('lista.pdf');
    });

    it('answers 404 for a scan of another meeting', async () => {
      prisma.meetingAttendanceFile.findFirst.mockResolvedValue(null);

      await expect(
        service.download('meeting-1', 'file-9', user),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('keeps an approved scan away from anyone but the director', async () => {
      await expect(service.remove('meeting-1', 'file-1', user)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.document.update).not.toHaveBeenCalled();
    });

    it('moves the scan to the documents trash for the director', async () => {
      await service.remove('meeting-1', 'file-1', director);

      const [args] = prisma.document.update.mock.calls[0] as [
        { where: unknown; data: { deletedAt: unknown } },
      ];
      expect(args.where).toEqual({ id: 'document-1' });
      expect(args.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
