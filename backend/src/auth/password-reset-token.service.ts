import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'node:crypto';

export const PASSWORD_RESET_TTL_MINUTES = 60;

@Injectable()
export class PasswordResetTokenService {
  constructor(private readonly prisma: PrismaService) {}
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(userId: string): Promise<string> {
    await this.invalidateAllForUser(userId);
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_TTL_MINUTES);
    await this.prisma.passwordResetToken.create({
      data: { tokenHash: this.hash(token), userId, expiresAt },
    });

    return token;
  }

  async consume(token: string): Promise<string | null> {
    const key = this.hash(token);
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: key },
    });
    if (!record) {
      return null;
    }

    if (record.expiresAt < new Date()) {
      return null;
    }
    if (record.usedAt) {
      return null;
    }

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return record.userId;
  }
  async invalidateAllForUser(userId: string) {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
