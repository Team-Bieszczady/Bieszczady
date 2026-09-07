import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

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
    }

    const folder = await this.prisma.folder.findFirst({
      where: { id: id, projectId: projectId },
    });
    if (!folder) {
      throw new NotFoundException(
        'Wskazany folder nie należy do tego projektu',
      );
    }

    return await this.prisma.folder.update({
      where: {
        id,
        projectId,
      },
      data: { name, parentId },
    });
  }
}
