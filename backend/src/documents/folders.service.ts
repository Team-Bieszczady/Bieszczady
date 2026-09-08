import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

const MAX_FOLDER_DEPTH = 50;

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllForProject(id: string) {
    return await this.prisma.folder.findMany({
      where: { projectId: id, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async createFolder(id: string, ownerId: string, dto: CreateFolderDto) {
    const name = dto.name;
    const parentId = dto.parentId;
    return await this.prisma.folder.create({
      data: { name, parentId, projectId: id, ownerId: ownerId },
    });
  }

  async updateFolder(id: string, projectId: string, dto: UpdateFolderDto) {
    const name = dto.name;
    const parentId = dto.parentId;

    if (parentId) {
      const parentFolder = await this.prisma.folder.findFirst({
        where: { id: parentId, projectId: projectId },
      });
      if (!parentFolder) {
        throw new BadRequestException(
          'Wskazany folder nadrzędny nie należy do tego projektu',
        );
      }

      await this.assertNoCycle(parentId, id);
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: id, projectId: projectId },
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
  async deleteFolder(id: string, projectId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: id, projectId: projectId },
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
}
