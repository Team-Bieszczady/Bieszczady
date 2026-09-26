import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { ProjectAccessService } from '../projects/project-access.service';
import { AuthenticatedUser } from '../auth/types/auth.types';

const MAX_FOLDER_DEPTH = 50;
const TEMPLATE_FOLDERS = [
  'Organizacyjne',
  'Robocze',
  'Dokumenty z instytucjami',
  'Promocyjne',
  'Zatwierdzone',
  'Sprawozdawczość',
];

@Injectable()
export class FoldersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async findAllForProject(id: string, actor: AuthenticatedUser) {
    await this.access.assertCanRead(actor, id);

    const folders = await this.prisma.folder.findMany({
      where: { projectId: id, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    const canManage = await this.access.canManageTasks(actor, id);
    if (canManage) {
      const pendingByFolder = await this.countPendingByFolder(id, folders);
      return folders.map((folder) => ({
        ...folder,
        pendingCount: pendingByFolder.get(folder.id) ?? 0,
      }));
    }

    const granted = await this.prisma.documentAccess.findMany({
      where: { projectId: id, userId: actor.id, folderId: { not: null } },
      select: { folderId: true },
    });
    const grantedIds = new Set(granted.map((g) => g.folderId));
    const byId = new Map(folders.map((f) => [f.id, f]));

    const visible = folders.filter((folder) => {
      let current: typeof folder | undefined = folder;
      while (current) {
        if (grantedIds.has(current.id)) {
          return true;
        }
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
      return false;
    });

    const visibleIds = new Set(visible.map((f) => f.id));
    return visible.map((folder) => ({
      ...folder,
      pendingCount: 0,
      parentId:
        folder.parentId && visibleIds.has(folder.parentId)
          ? folder.parentId
          : null,
    }));
  }

  private async countPendingByFolder(
    projectId: string,
    folders: { id: string; parentId: string | null }[],
  ) {
    const grouped = await this.prisma.document.groupBy({
      by: ['folderId'],
      where: { projectId, status: 'PENDING_APPROVAL', deletedAt: null },
      _count: true,
    });

    const byId = new Map(folders.map((folder) => [folder.id, folder]));
    const totals = new Map(folders.map((folder) => [folder.id, 0]));

    for (const row of grouped) {
      let current = byId.get(row.folderId);
      let steps = 0;

      while (current && steps++ <= MAX_FOLDER_DEPTH) {
        totals.set(current.id, (totals.get(current.id) ?? 0) + row._count);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
    }

    return totals;
  }

  async createFolder(
    id: string,
    ownerId: string,
    dto: CreateFolderDto,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, id);
    await this.access.assertNotArchived(id);

    const canManage = await this.access.canManageTasks(actor, id);
    if (!canManage) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator projektu może zarządzać folderami',
      );
    }

    if (dto.parentId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: { id: dto.parentId, projectId: id, deletedAt: null },
      });
      if (!parentFolder) {
        throw new BadRequestException(
          'Wskazany folder nadrzędny nie należy do tego projektu',
        );
      }
    }
    const name = dto.name;
    const parentId = dto.parentId;
    return await this.prisma.folder.create({
      data: { name, parentId, projectId: id, ownerId: ownerId },
    });
  }

  async updateFolder(
    id: string,
    projectId: string,
    dto: UpdateFolderDto,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);

    const canManage = await this.access.canManageTasks(actor, projectId);
    if (!canManage) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator projektu może zarządzać folderami',
      );
    }

    const name = dto.name;
    const parentId = dto.parentId;

    if (parentId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: { id: parentId, projectId: projectId, deletedAt: null },
      });
      if (!parentFolder) {
        throw new BadRequestException(
          'Wskazany folder nadrzędny nie należy do tego projektu',
        );
      }

      await this.assertNoCycle(parentId, id);
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: id, projectId: projectId, deletedAt: null },
    });
    if (!folder) {
      throw new NotFoundException('Nie znaleziono folderu');
    }

    return await this.prisma.folder.update({
      where: {
        id,
        projectId,
      },
      data: { name, parentId },
    });
  }
  async deleteFolder(id: string, projectId: string, actor: AuthenticatedUser) {
    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);

    const canManage = await this.access.canManageTasks(actor, projectId);
    if (!canManage) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator projektu może zarządzać folderami',
      );
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: id, projectId: projectId, deletedAt: null },
    });
    if (!folder) {
      throw new NotFoundException(
        'Wskazany folder nie należy do tego projektu',
      );
    }

    const childrenFolders = await this.prisma.folder.findFirst({
      where: { parentId: id, deletedAt: null },
    });
    const childrenDocuments = await this.prisma.document.findFirst({
      where: { folderId: id, deletedAt: null },
    });

    if (childrenFolders || childrenDocuments) {
      throw new BadRequestException(
        'Folder nie jest pusty. Usuń najpierw jego zawartość.',
      );
    } else {
      return await this.prisma.folder.update({
        where: { id: id },
        data: { deletedAt: new Date() },
      });
    }
  }

  private async assertNoCycle(
    parentId: string,
    folderId: string,
  ): Promise<void> {
    let currentId: string | null = parentId;
    let steps = 0;

    while (currentId) {
      const cursor: string = currentId;
      if (cursor === folderId) {
        throw new BadRequestException(
          'Nie można przenieść folderu do jego własnego podfolderu',
        );
      }

      if (steps++ > MAX_FOLDER_DEPTH) {
        throw new BadRequestException(
          'Struktura folderów jest uszkodzona: wykryto zapętlenie',
        );
      }

      const current = await this.prisma.folder.findFirst({
        where: { id: cursor },
        select: { parentId: true },
      });

      currentId = current?.parentId ?? null;
    }
  }
  async createTemplate(
    projectId: string,
    ownerId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);

    const canManage = await this.access.canManageTasks(actor, projectId);
    if (!canManage) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator projektu może zarządzać folderami',
      );
    }

    const existing = await this.prisma.folder.count({
      where: { projectId, deletedAt: null },
    });
    if (existing > 0) {
      throw new BadRequestException('Projekt ma już foldery');
    }

    await this.prisma.folder.createMany({
      data: TEMPLATE_FOLDERS.map((name) => ({ projectId, name, ownerId })),
    });

    return await this.findAllForProject(projectId, actor);
  }
}
