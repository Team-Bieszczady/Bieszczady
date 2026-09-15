import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import { StageCompletionService } from './stage-completion.service';
import { ProjectAccessService } from './project-access.service';
import {
  CreateActivityDto,
  MoveActivityDto,
  UpdateActivityDto,
} from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly completion: StageCompletionService,
    private readonly access: ProjectAccessService,
  ) {}

  async create(stageId: string, dto: CreateActivityDto) {
    const stage = await this.prisma.stage.findUnique({
      where: { id: stageId },
    });
    if (!stage) throw new NotFoundException('Nie znaleziono etapu');
    await this.access.assertNotArchived(stage.projectId);

    const last = await this.prisma.activity.aggregate({
      where: { stageId },
      _max: { sortOrder: true },
    });

    return this.prisma.activity.create({
      data: {
        stageId,
        name: dto.name,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async update(id: string, dto: UpdateActivityDto) {
    const { projectId } = await this.access.locateActivity(id);
    await this.access.assertNotArchived(projectId);

    const data: Prisma.ActivityUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;

    return this.prisma.activity.update({ where: { id }, data });
  }

  async move(id: string, dto: MoveActivityDto) {
    return this.prisma.$transaction(async (tx) => {
      const activity = await this.access.locateActivity(id, tx);

      const target = await tx.stage.findUnique({
        where: { id: dto.stageId },
      });
      if (!target)
        throw new NotFoundException('Nie znaleziono etapu docelowego');

      await this.access.assertNotArchived(activity.projectId, tx);
      if (target.projectId !== activity.projectId) {
        await this.access.assertNotArchived(target.projectId, tx);
      }

      const from = activity.stageId;
      if (from === target.id) {
        return tx.activity.findUniqueOrThrow({ where: { id } });
      }

      const last = await tx.activity.aggregate({
        where: { stageId: target.id },
        _max: { sortOrder: true },
      });

      const moved = await tx.activity.update({
        where: { id },
        data: {
          stageId: target.id,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });

      await this.completion.settle(tx, [from, target.id]);
      return moved;
    }, SERIALIZABLE);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const activity = await this.access.locateActivity(id, tx);
      await this.access.assertNotArchived(activity.projectId, tx);

      await tx.subtask.deleteMany({ where: { task: { activityId: id } } });
      await tx.task.deleteMany({ where: { activityId: id } });
      await tx.activity.delete({ where: { id } });
      await this.completion.settle(tx, [activity.stageId]);
    }, SERIALIZABLE);
  }
}
