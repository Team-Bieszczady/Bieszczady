import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

export const REFRESH_TOKEN_TTL_DAYS = 7;
export const REUSE_GRACE_SECONDS = 30;

@Injectable()
export class RefreshTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(userId: string): Promise<string> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
    await this.prisma.refreshToken.create({
      data: { tokenHash: this.hash(token), userId, expiresAt },
    });

    return token;
  }

  async consume(token: string): Promise<string | null> {
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(token) },
    });
    if (!record) {
      return null;
    }

    if (record.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: record.id } });
      return null;
    }

    if (record.usedAt) {
      if (this.isWithinGracePeriod(record.usedAt)) {
        return record.userId;
      }
      await this.revokeAllForUser(record.userId);
      return null;
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return record.userId;
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash: this.hash(token) },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private isWithinGracePeriod(usedAt: Date): boolean {
    return Date.now() - usedAt.getTime() < REUSE_GRACE_SECONDS * 1000;
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
