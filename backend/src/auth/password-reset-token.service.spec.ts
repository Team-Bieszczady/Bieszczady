import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  PasswordResetTokenService,
  PASSWORD_RESET_TTL_MINUTES,
} from './password-reset-token.service';

interface StoredRow {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

/**
 * Stands in for the password_reset_tokens table. Only the three operations the
 * service actually uses are implemented; anything else would be untested code.
 */
function createFakePrisma() {
  const rows: StoredRow[] = [];
  let nextId = 1;

  return {
    rows,
    passwordResetToken: {
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
      updateMany: ({
        where,
        data,
      }: {
        where: { userId: string; usedAt: null };
        data: { usedAt: Date };
      }) => {
        const matched = rows.filter(
          (row) => row.userId === where.userId && row.usedAt === null,
        );
        for (const row of matched) {
          row.usedAt = data.usedAt;
        }
        return Promise.resolve({ count: matched.length });
      },
    },
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('PasswordResetTokenService', () => {
  let prisma: ReturnType<typeof createFakePrisma>;
  let service: PasswordResetTokenService;

  beforeEach(() => {
    prisma = createFakePrisma();
    service = new PasswordResetTokenService(prisma as unknown as PrismaService);
  });

  describe('issue', () => {
    it('returns a 64 character token', async () => {
      const token = await service.issue('user-1');

      expect(token).toHaveLength(64);
    });

    it('returns a different token every time', async () => {
      const first = await service.issue('user-1');
      const second = await service.issue('user-1');

      expect(first).not.toBe(second);
    });

    it('stores the hash, never the token itself', async () => {
      const token = await service.issue('user-1');

      expect(prisma.rows[0].tokenHash).not.toBe(token);
      expect(prisma.rows[0].tokenHash).toBe(sha256(token));
    });

    it('expires the token after the configured number of minutes', async () => {
      const before = Date.now();
      await service.issue('user-1');

      const lifetimeMs = prisma.rows[0].expiresAt.getTime() - before;
      const expectedMs = PASSWORD_RESET_TTL_MINUTES * 60 * 1000;

      // A second of slack, because the clock moves between the two readings.
      expect(Math.abs(lifetimeMs - expectedMs)).toBeLessThan(1000);
    });

    it('starts the token as unused', async () => {
      await service.issue('user-1');

      expect(prisma.rows[0].usedAt).toBeNull();
    });

    it('kills the previous token when a new one is issued', async () => {
      const first = await service.issue('user-1');
      await service.issue('user-1');

      // Asking for a second link must leave only one usable one, so a stolen
      // or forwarded older email stops working the moment the user tries again.
      await expect(service.consume(first)).resolves.toBeNull();
    });

    it('leaves the newest token usable', async () => {
      await service.issue('user-1');
      const second = await service.issue('user-1');

      await expect(service.consume(second)).resolves.toBe('user-1');
    });

    it('does not touch tokens belonging to other users', async () => {
      const other = await service.issue('user-2');
      await service.issue('user-1');

      await expect(service.consume(other)).resolves.toBe('user-2');
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

    it('marks the token as used', async () => {
      const token = await service.issue('user-1');

      await service.consume(token);

      expect(prisma.rows[0].usedAt).toBeInstanceOf(Date);
    });

    it('rejects a token used a second time', async () => {
      const token = await service.issue('user-1');
      await service.consume(token);

      await expect(service.consume(token)).resolves.toBeNull();
    });

    it('rejects a token past its expiry date', async () => {
      const token = await service.issue('user-1');
      prisma.rows[0].expiresAt = new Date(Date.now() - 1000);

      await expect(service.consume(token)).resolves.toBeNull();
    });

    it('rejects an expired token even before checking whether it was used', async () => {
      const token = await service.issue('user-1');
      prisma.rows[0].expiresAt = new Date(Date.now() - 1000);

      await service.consume(token);

      // An expired token must not be silently marked used: the row should stay
      // untouched so the reason it failed remains visible in the table.
      expect(prisma.rows[0].usedAt).toBeNull();
    });
  });
});
