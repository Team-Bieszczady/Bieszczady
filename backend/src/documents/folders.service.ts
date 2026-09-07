import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';

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
}
