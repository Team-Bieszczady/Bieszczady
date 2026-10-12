import { Prisma } from '@prisma/client';

export const ATTENDANCE_FOLDER_NAME = 'Listy obecności';

export const ATTENDANCE_FILE_FIELDS = {
  id: true,
  document: {
    select: {
      name: true,
      status: true,
      versions: {
        orderBy: { versionNo: 'desc' },
        take: 1,
        select: { fileName: true, sizeBytes: true },
      },
    },
  },
} satisfies Prisma.MeetingAttendanceFileSelect;

type StoredAttendanceFile = Prisma.MeetingAttendanceFileGetPayload<{
  select: typeof ATTENDANCE_FILE_FIELDS;
}>;

export function isLockedDocument(status: string) {
  return status === 'APPROVED' || status === 'SIGNED';
}

export function toAttendanceFile(
  file: StoredAttendanceFile,
  viewer: { isDirector: boolean },
) {
  const latest = file.document.versions[0];
  return {
    id: file.id,
    name: file.document.name,
    fileName: latest?.fileName ?? '',
    sizeBytes: latest?.sizeBytes ?? 0,
    canDelete: viewer.isDirector || !isLockedDocument(file.document.status),
  };
}
