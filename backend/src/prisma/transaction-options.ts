import { Prisma } from '@prisma/client';

export const SERIALIZABLE = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
} as const;
