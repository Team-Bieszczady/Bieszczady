import { Prisma } from '@prisma/client';

export const ATTENDED_MEETING: Prisma.MeetingWhereInput = {
  deletedAt: null,
  status: { not: 'CANCELLED' },
};
