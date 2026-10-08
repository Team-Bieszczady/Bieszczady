import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  RefreshTokenService,
  REUSE_GRACE_SECONDS,
} from './refresh-token.service';

interface StoredRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

interface RowFilter {
  userId?: string;
  tokenHash?: string;
  expiresAt?: { lt: Date };
}

/**
 * Stands in for the refresh_tokens table. Only the operations the service
 * actually uses are implemented; anything else would be untested code.
 */
function createFakePrisma() {
  const rows: StoredRow[] = [];
  let nextId = 1;

  const matches = (row: StoredRow, where: RowFilter) =>
    (where.userId === undefined || row.userId === where.userId) &&
    (where.tokenHash === undefined || row.tokenHash === where.tokenHash) &&
    (where.expiresAt === undefined || row.expiresAt < where.expiresAt.lt);

  return {
    rows,
    refreshToken: {
      create: ({
        data,
      }: {
        data: { userId: string; tokenHash: string; expiresAt: Date };
      }) => {
        const row: StoredRow = {
          id: `row-${nextId++}`,
          usedAt: null,
          ...data,
        };
        rows.push(row);
        return Promise.resolve(row);
      },
      findUnique: ({ where }: { where: { tokenHash: string } }) =>
        Promise.resolve(
          rows.find((row) => row.tokenHash === where.tokenHash) ?? null,
        ),
      update: ({
        where,
        data,
      }: {
        where: { id: string };
        data: { usedAt: Date };
      }) => {
        const row = rows.find((item) => item.id === where.id);
        if (row) {
          row.usedAt = data.usedAt;
        }
        return Promise.resolve(row);
      },
      delete: ({ where }: { where: { id: string } }) => {
        const index = rows.findIndex((row) => row.id === where.id);
        const [removed] = rows.splice(index, 1);
        return Promise.resolve(removed);
      },
      deleteMany: ({ where }: { where: RowFilter }) => {
        const kept = rows.filter((row) => !matches(row, where));
        const count = rows.length - kept.length;
        rows.splice(0, rows.length, ...kept);
        return Promise.resolve({ count });
      },
    },
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function secondsAgo(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}

describe('RefreshTokenService', () => {
  let prisma: ReturnType<typeof createFakePrisma>;
  let service: RefreshTokenService;

  const rowOf = (token: string) => {
    const row = prisma.rows.find((item) => item.tokenHash === sha256(token));
    if (!row) throw new Error('token not stored');
    return row;
  };

  beforeEach(() => {
    prisma = createFakePrisma();
    service = new RefreshTokenService(prisma as unknown as PrismaService);
  });

  describe('issue', () => {
    it('issues a 64 character token', async () => {
      const token = await service.issue('user-1');

      expect(token).toHaveLength(64);
    });

    it('issues a different token every time', async () => {
      const first = await service.issue('user-1');
      const second = await service.issue('user-1');

      expect(first).not.toBe(second);
    });

    it('stores the hash, never the token itself', async () => {
      const token = await service.issue('user-1');

      expect(prisma.rows[0].tokenHash).toBe(sha256(token));
    });

    it('clears the expired tokens of the user', async () => {
      const old = await service.issue('user-1');
      rowOf(old).expiresAt = secondsAgo(1);

      await service.issue('user-1');

      expect(prisma.rows).toHaveLength(1);
    });
  });

  describe('consume', () => {
    it('returns the user id for a valid token', async () => {
      const token = await service.issue('user-1');

      await expect(service.consume(token)).resolves.toBe('user-1');
    });

    it('returns null for an unknown token', async () => {
      await expect(service.consume('not-a-real-token')).resolves.toBeNull();
    });

    it('rejects a token past its expiry date', async () => {
      const token = await service.issue('user-1');
      rowOf(token).expiresAt = secondsAgo(1);

      await expect(service.consume(token)).resolves.toBeNull();
    });

    it('accepts a token used again within the grace period', async () => {
      const token = await service.issue('user-1');
      await service.consume(token);

      await expect(service.consume(token)).resolves.toBe('user-1');
    });

    it('rejects a token used again after the grace period', async () => {
      const token = await service.issue('user-1');
      await service.consume(token);
      rowOf(token).usedAt = secondsAgo(REUSE_GRACE_SECONDS + 1);

      await expect(service.consume(token)).resolves.toBeNull();
    });

    it('revokes every session of the user when late reuse is detected', async () => {
      const stolen = await service.issue('user-1');
      const otherSession = await service.issue('user-1');
      await service.consume(stolen);
      rowOf(stolen).usedAt = secondsAgo(REUSE_GRACE_SECONDS + 1);

      await service.consume(stolen);

      await expect(service.consume(otherSession)).resolves.toBeNull();
    });

    it('leaves other users untouched when late reuse is detected', async () => {
      const stolen = await service.issue('user-1');
      const unrelated = await service.issue('user-2');
      await service.consume(stolen);
      rowOf(stolen).usedAt = secondsAgo(REUSE_GRACE_SECONDS + 1);

      await service.consume(stolen);

      await expect(service.consume(unrelated)).resolves.toBe('user-2');
    });
  });

  describe('revoke', () => {
    it('makes a token unusable after logging out', async () => {
      const token = await service.issue('user-1');

      await service.revoke(token);

      await expect(service.consume(token)).resolves.toBeNull();
    });
  });
});
