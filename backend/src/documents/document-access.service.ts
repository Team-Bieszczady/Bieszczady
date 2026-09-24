import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types/auth.types';
import { ProjectAccessService } from '../projects/project-access.service';
import { GrantAccessDto } from './dto/grant-access.dto';

const MAX_FOLDER_DEPTH = 50;

@Injectable()
export class DocumentAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
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

  async grant(
    actor: AuthenticatedUser,
    projectId: string,
    dto: GrantAccessDto,
  ) {
    const canManage = await this.access.canManageTasks(actor, projectId);

    if (!canManage) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator projektu może udostępniać dokumenty',
      );
    }

    if (
      (dto.folderId && dto.documentId) ||
      (!dto.folderId && !dto.documentId)
    ) {
      throw new BadRequestException('Wskaż folder albo dokument');
    }
    if (dto.folderId) {
      const folder = await this.prisma.folder.findFirst({
        where: { id: dto.folderId, projectId: projectId, deletedAt: null },
      });
      if (!folder) {
        throw new NotFoundException(
          'Wskazany folder nie należy do tego projektu',
        );
      }
    }

    if (dto.documentId) {
      const document = await this.prisma.document.findFirst({
        where: {
          id: dto.documentId,
          projectId: projectId,
          deletedAt: null,
        },
      });
      if (!document) {
        throw new NotFoundException(
          'Wskazany dokument nie należy do tego projektu',
        );
      }
    }

    const member = await this.prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: dto.userId,
      },
    });

    if (!member) {
      throw new BadRequestException('Ta osoba nie należy do projektu');
    }
    if (dto.folderId) {
      return await this.prisma.documentAccess.upsert({
        where: {
          folderId_userId: { folderId: dto.folderId, userId: dto.userId },
        },
        update: { level: dto.level, grantedById: actor.id },
        create: {
          projectId,
          folderId: dto.folderId,
          userId: dto.userId,
          level: dto.level,
          grantedById: actor.id,
        },
      });
    }

    if (dto.documentId) {
      return await this.prisma.documentAccess.upsert({
        where: {
          documentId_userId: { documentId: dto.documentId, userId: dto.userId },
        },
        update: { level: dto.level, grantedById: actor.id },
        create: {
          projectId,
          documentId: dto.documentId,
          userId: dto.userId,
          level: dto.level,
          grantedById: actor.id,
        },
      });
    }
  }

  async revoke(actor: AuthenticatedUser, projectId: string, accessId: string) {
    const canManage = await this.access.canManageTasks(actor, projectId);
    if (!canManage) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator projektu może odbierać dostęp do dokumentów',
      );
    }
    const access = await this.prisma.documentAccess.findFirst({
      where: { id: accessId, projectId },
    });
    if (!access) {
      throw new NotFoundException('Nie znaleziono wpisu o dostępie');
    }

    await this.prisma.documentAccess.delete({ where: { id: accessId } });
  }

  async listFor(
    actor: AuthenticatedUser,
    projectId: string,
    target: { folderId?: string; documentId?: string },
  ) {
 const canManage = await this.access.canManageTasks(actor, projectId);
 if (!canManage) {
   throw new ForbiddenException(
     'Tylko dyrektor lub koordynator projektu może przeglądać udostępnienia',
   );
 }

const list = await this.prisma.documentAccess.findMany({
    where: {
        projectId,
        folderId: target.folderId ?? null,
        documentId: target.documentId ?? null
    },
    include: {
        user: {select: {firstName: true, lastName: true, email: true}}
    }
})
return list
  }
}
