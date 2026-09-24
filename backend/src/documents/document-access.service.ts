import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/auth.types';
import { ProjectAccessService } from '../projects/project-access.service';

const MAX_FOLDER_DEPTH = 50;

@Injectable()
export class DocumentAccessService {
  constructor(private readonly prisma: PrismaService,
      private readonly access: ProjectAccessService
  ) {}

  async folderLevelFor(
    folderId: string,
    userId: string,
  ): Promise<string | null> {
    let currentId: string | null = folderId;
    let steps = 0;

    while (currentId) {
      const cursor: string = currentId;

      const access = await this.prisma.documentAccess.findFirst({
        where: { folderId: cursor, userId },
      });
      if (access) {
        return access.level;
      }

      if (steps++ > MAX_FOLDER_DEPTH) {
        throw new BadRequestException(
          'Struktura folderów jest uszkodzona: wykryto zapętlenie',
        );
      }

      const parent = await this.prisma.folder.findFirst({
        where: { id: cursor },
        select: { parentId: true },
      });

      currentId = parent?.parentId ?? null;
    }

    return null;
  }

  async documentLevelFor(
    documentId: string,
    userId: string,
  ): Promise<string | null> {
    const access = await this.prisma.documentAccess.findFirst({
      where: { documentId: documentId, userId },
    });
    if (access) {
      return access.level;
    }

    const doc = await this.prisma.document.findFirst({
      where: { id: documentId },
      select: { folderId: true },
    });

    if (!doc) {
      return null;
    }

    return await this.folderLevelFor(doc.folderId, userId);
  }

  async levelFor(
    actor: AuthenticatedUser,
    projectId: string,
    target: { folderId?: string; documentId?: string },
  ): Promise<string | null> {

const canManage = await this.access.canManageTasks(actor, projectId);
if (canManage) {
  return 'EDIT';
}
if (target.documentId) {
  return await this.documentLevelFor(target.documentId, actor.id);
}
if (target.folderId) {
  return await this.folderLevelFor(target.folderId, actor.id);
}
return null;


  }
}
