import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

export const REFRESH_TOKEN_TTL_DAYS = 7;

interface StoredToken {
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
}

@Injectable()
export class RefreshTokenService {
  private readonly store = new Map<string, StoredToken>();

  issue(userId: string): string {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
    this.store.set(this.hash(token), { userId, expiresAt, usedAt: null });
    return token;
  }

  consume(token: string): string | null {
    const key = this.hash(token);
    const record = this.store.get(key);
    if (!record) {
      return null;
    }

    if (record.expiresAt < new Date()) {
      this.store.delete(key);
      return null;
    }

    if (record.usedAt) {
      this.revokeAllForUser(record.userId);
      return null;
    }

    record.usedAt = new Date();
    return record.userId;
  }

  revoke(token: string): void {
    this.store.delete(this.hash(token));
  }

  revokeAllForUser(userId: string): void {
    for (const [hash, record] of this.store.entries()) {
      if (record.userId === userId) {
        this.store.delete(hash);
      }
    }
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
