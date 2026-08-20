import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogEntry {
  actorId: string;
  targetId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        targetId: entry.targetId,
        action: entry.action,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      },
    });
  }
}
