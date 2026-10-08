import { Prisma } from '@prisma/client';

export const ATTENDANCE_FOLDER_NAME = 'Listy obecności';

export const ATTENDANCE_FILE_FIELDS = {
  id: true,
  document: {
    select: {
      name: true,
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

export function toAttendanceFile(file: StoredAttendanceFile) {
  const latest = file.document.versions[0];
  return {
    id: file.id,
    name: file.document.name,
    fileName: latest?.fileName ?? '',
    sizeBytes: latest?.sizeBytes ?? 0,
  };
}
