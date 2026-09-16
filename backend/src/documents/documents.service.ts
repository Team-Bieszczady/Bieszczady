import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { randomUUID } from 'crypto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { buffer } from 'stream/consumers';
import { CreateVersionDto } from './dto/create-version.dto';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

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
    file: UploadedFile,
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

  async createVersion(
    documentId: string,
    projectId: string,
    ownerId: string,
    dto: CreateVersionDto,
    file: UploadedFile,
  ) {
    const versionLast = await this.prisma.documentVersion.findFirst({
      where: {
        document: { projectId, id: documentId, deletedAt: null },
      },
      orderBy: { versionNo: 'desc' },
    });
    if (!versionLast) {
      throw new NotFoundException('nie ma');
    }
    const newVersion = versionLast.versionNo + 1;
    const key = `${projectId}/${documentId}/v${newVersion}`;
    await this.storage.save(key, file.buffer, file.mimetype);
    const version = await this.prisma.documentVersion.create({
      data: {
        documentId: documentId,
        versionNo: newVersion,
        storageKey: key,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: ownerId,
        changeNote: dto.changeNote,
      },
    });

    return version;
  }

  async getDocuments(projectId: string, folderId: string) {
    await this.assertFolderExists(folderId, projectId);
    const documents = await this.prisma.document.findMany({
      where: { projectId, folderId, deletedAt: null },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
          include: {
            uploadedBy: { select: { firstName: true, lastName: true } },
          },
        },
      },

      orderBy: { updatedAt: 'desc' },
    });
    return documents;
  }

  async downloadDocument(
    projectId: string,
    documentId: string,
    versionNo: number,
  ) {
    const version = await this.prisma.documentVersion.findFirst({
      where: {
        document: { projectId, id: documentId, deletedAt: null },
        versionNo: versionNo,
      },
    });
    if (!version) {
      throw new NotFoundException('Nie znaleziono wskazanej wersji dokumentu');
    }
    const buffer = await this.storage.read(version.storageKey);
    return { buffer, fileName: version.fileName, mimeType: version.mimeType };
  }

  async getVersions(projectId: string, documentId: string) {
    const versions = await this.prisma.documentVersion.findMany({
      where: {
        document: { projectId, id: documentId, deletedAt: null },
      },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: {
        versionNo: 'desc',
      },
    });
    if (versions.length === 0) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }

    return versions;
  }
}
