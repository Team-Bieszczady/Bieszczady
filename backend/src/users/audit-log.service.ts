import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditMetadata = Record<
  string,
  string | number | boolean | null | string[]
>;

export interface AuditLogEntry {
  actorId: string;
  targetId: string;
  action: string;
  metadata?: AuditMetadata | string;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.write(this.prisma, entry);
  }

  async recordInTransaction(
    tx: Prisma.TransactionClient,
    entry: AuditLogEntry,
  ): Promise<void> {
    await this.write(tx, entry);
  }

  private async write(
    client: Prisma.TransactionClient,
    entry: AuditLogEntry,
  ): Promise<void> {
    await client.auditLog.create({
      data: {
        actorId: entry.actorId,
        targetId: entry.targetId,
        action: entry.action,
        metadata: this.serializeMetadata(entry.metadata),
      },
    });
  }

  private serializeMetadata(
    metadata: AuditLogEntry['metadata'],
  ): string | null {
    if (metadata === undefined) {
      return null;
    }

    return typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
  }
}
