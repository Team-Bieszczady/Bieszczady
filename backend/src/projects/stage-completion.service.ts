import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class StageCompletionService {
  async settle(
    tx: Prisma.TransactionClient,
    stageIds: ReadonlyArray<string | null | undefined>,
  ): Promise<void> {
    const unique = [...new Set(stageIds.filter((id): id is string => !!id))];
    if (unique.length === 0) return;

    for (const stageId of unique) {
      const stage = await tx.stage.findUnique({
        where: { id: stageId },
        select: { id: true, completedAt: true },
      });
      if (!stage) continue;

      const total = await tx.task.count({
        where: { activity: { stageId } },
      });
      const pending =
        total === 0
          ? 1
          : await tx.task.count({
              where: { activity: { stageId }, status: { not: 'DONE' } },
            });

      const shouldBeClosed = total > 0 && pending === 0;
      const isClosed = stage.completedAt !== null;
      if (shouldBeClosed === isClosed) continue;

      await tx.stage.update({
        where: { id: stageId },
        data: { completedAt: shouldBeClosed ? new Date() : null },
      });
    }
  }
}
