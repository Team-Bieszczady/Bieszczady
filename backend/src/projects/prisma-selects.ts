import { Prisma } from '@prisma/client';

export const PERSON_SELECT = {
  select: { id: true, firstName: true, lastName: true },
} satisfies { select: Prisma.UserSelect };
