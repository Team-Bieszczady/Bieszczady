import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { StatusColor } from '../common/enums/project.enums';

export interface DictionaryEntry {
  id: string;
  name: string;
  active: boolean;
  color?: string;
}

@Injectable()
export class DictionariesService {
  constructor(private readonly prisma: PrismaService) {}

  async listStatuses(): Promise<DictionaryEntry[]> {
    return this.prisma.projectStatus.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, color: true, active: true },
    });
  }

  async createStatus(name: string, color: StatusColor) {
    try {
      return await this.prisma.projectStatus.create({
        data: { name, color },
        select: { id: true, name: true, color: true, active: true },
      });
    } catch (error) {
      throw this.asConflict(error, 'A status with this name already exists');
    }
  }

  async updateStatus(
    id: string,
    patch: { name?: string; color?: StatusColor; active?: boolean },
  ) {
    await this.assertExists('status', id);

    const data: Prisma.ProjectStatusUpdateInput = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.color !== undefined) data.color = patch.color;
    if (patch.active !== undefined) data.active = patch.active;

    try {
      return await this.prisma.projectStatus.update({
        where: { id },
        data,
        select: { id: true, name: true, color: true, active: true },
      });
    } catch (error) {
      throw this.asConflict(error, 'A status with this name already exists');
    }
  }

  async removeStatus(id: string): Promise<void> {
    await this.assertExists('status', id);
    const usage = await this.prisma.project.count({ where: { statusId: id } });
    this.assertUnused(usage, 'status');
    await this.prisma.projectStatus.delete({ where: { id } });
  }

  async listTypes(): Promise<DictionaryEntry[]> {
    return this.prisma.projectType.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, active: true },
    });
  }

  async createType(name: string) {
    try {
      return await this.prisma.projectType.create({
        data: { name },
        select: { id: true, name: true, active: true },
      });
    } catch (error) {
      throw this.asConflict(error, 'A type with this name already exists');
    }
  }

  async updateType(id: string, patch: { name?: string; active?: boolean }) {
    await this.assertExists('type', id);

    const data: Prisma.ProjectTypeUpdateInput = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.active !== undefined) data.active = patch.active;

    try {
      return await this.prisma.projectType.update({
        where: { id },
        data,
        select: { id: true, name: true, active: true },
      });
    } catch (error) {
      throw this.asConflict(error, 'A type with this name already exists');
    }
  }

  async removeType(id: string): Promise<void> {
    await this.assertExists('type', id);
    const usage = await this.prisma.projectTypesOnProjects.count({
      where: { projectTypeId: id },
    });
    this.assertUnused(usage, 'type');
    await this.prisma.projectType.delete({ where: { id } });
  }

  async listRecipients(): Promise<DictionaryEntry[]> {
    return this.prisma.projectRecipient.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, active: true },
    });
  }

  async createRecipient(name: string) {
    try {
      return await this.prisma.projectRecipient.create({
        data: { name },
        select: { id: true, name: true, active: true },
      });
    } catch (error) {
      throw this.asConflict(error, 'A recipient with this name already exists');
    }
  }

  async updateRecipient(
    id: string,
    patch: { name?: string; active?: boolean },
  ) {
    await this.assertExists('recipient', id);

    const data: Prisma.ProjectRecipientUpdateInput = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.active !== undefined) data.active = patch.active;

    try {
      return await this.prisma.projectRecipient.update({
        where: { id },
        data,
        select: { id: true, name: true, active: true },
      });
    } catch (error) {
      throw this.asConflict(error, 'A recipient with this name already exists');
    }
  }

  async removeRecipient(id: string): Promise<void> {
    await this.assertExists('recipient', id);
    const usage = await this.prisma.projectRecipientsOnProjects.count({
      where: { recipientId: id },
    });
    this.assertUnused(usage, 'recipient');
    await this.prisma.projectRecipient.delete({ where: { id } });
  }

  private async assertExists(
    kind: 'status' | 'type' | 'recipient',
    id: string,
  ): Promise<void> {
    const found =
      kind === 'status'
        ? await this.prisma.projectStatus.count({ where: { id } })
        : kind === 'type'
          ? await this.prisma.projectType.count({ where: { id } })
          : await this.prisma.projectRecipient.count({ where: { id } });

    if (found === 0) throw new NotFoundException(`Project ${kind} not found`);
  }

  private assertUnused(usage: number, kind: string): void {
    if (usage > 0) {
      throw new ConflictException(
        `Cannot delete this ${kind}: it is used by ${usage} project(s)`,
      );
    }
  }

  private asConflict(error: unknown, message: string): Error {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return new ConflictException(message);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
