import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import { ProjectAccessService } from './project-access.service';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto/subtask.dto';

@Injectable()
export class SubtasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  private async findOrThrow(id: string) {
    const subtask = await this.prisma.subtask.findUnique({ where: { id } });
    if (!subtask) throw new NotFoundException('Subtask not found');
    return subtask;
  }

  async findAllForTask(taskId: string, actor: AuthenticatedUser) {
    const task = await this.access.locateTask(taskId);
    await this.access.assertCanRead(actor, task.projectId);

    return this.prisma.subtask.findMany({
      where: { taskId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(
    taskId: string,
    dto: CreateSubtaskDto,
    actor: AuthenticatedUser,
  ) {
    const task = await this.access.locateTask(taskId);
    this.access.assertOwnsTask(actor, task);

    return this.prisma.$transaction(async (tx) => {
      const last = await tx.subtask.aggregate({
        where: { taskId },
        _max: { sortOrder: true },
      });

      return tx.subtask.create({
        data: {
          taskId,
          title: dto.title,
          sortOrder: (last._max.sortOrder ?? 0) + 1,
        },
      });
    }, SERIALIZABLE);
  }

  async update(id: string, dto: UpdateSubtaskDto, actor: AuthenticatedUser) {
    const subtask = await this.findOrThrow(id);
    const task = await this.access.locateTask(subtask.taskId);
    this.access.assertOwnsTask(actor, task);

    const data: Prisma.SubtaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.done !== undefined) data.done = dto.done;

    return this.prisma.subtask.update({ where: { id }, data });
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    const subtask = await this.findOrThrow(id);
    const task = await this.access.locateTask(subtask.taskId);
    this.access.assertOwnsTask(actor, task);

    await this.prisma.subtask.delete({ where: { id } });
  }
}
