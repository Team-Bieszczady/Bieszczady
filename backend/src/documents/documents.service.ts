import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { randomUUID } from 'crypto';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async assertFolderExists(folderId: string, projectId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, projectId: projectId, deletedAt: null },
    });
    if (!folder) {
      throw new NotFoundException(
        'Wskazany folder nie należy do tego projektu',
      );
    }
  }
  async createDocument(
    projectId: string,
    folderId: string,
    ownerId: string,
    dto: CreateDocumentDto,
    file: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    },
  ) {
    await this.assertFolderExists(folderId, projectId);
    const documentId = randomUUID();
    const key = `${projectId}/${documentId}/v1`;

    await this.storage.save(key, file.buffer, file.mimetype);

    const [document, version] = await this.prisma.$transaction([
      this.prisma.document.create({
        data: {
          id: documentId,
          projectId,
          folderId,
          name: dto.name,
          kind: dto.kind,
          status: dto.status ?? 'DRAFT',
          ownerId,
        },
      }),
      this.prisma.documentVersion.create({
        data: {
          documentId,
          versionNo: 1,
          storageKey: key,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          uploadedById: ownerId,
        },
      }),
    ]);
    return { ...document, versions: [version] };
  }
}
