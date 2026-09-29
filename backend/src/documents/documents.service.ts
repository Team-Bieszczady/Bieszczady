import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { randomUUID } from 'crypto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { RestoreDocumentDto } from './dto/restore-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { AuthenticatedUser } from '../auth/types/auth.types';
import { ProjectAccessService } from '../projects/project-access.service';
import { DocumentAccessService } from './document-access.service';

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
    private readonly access: ProjectAccessService,
    private readonly documentAccess: DocumentAccessService,
  ) {}

  private async assertFolderExists(
    folderId: string,
    projectId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.assertFolderLevel(actor, projectId, folderId, false);
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, projectId: projectId, deletedAt: null },
    });
    if (!folder) {
      throw new NotFoundException(
        'Wskazany folder nie należy do tego projektu',
      );
    }
  }

  private async assertDocumentLevel(
    actor: AuthenticatedUser,
    projectId: string,
    documentId: string,
    needEdit: boolean,
  ) {
    const level = await this.documentAccess.levelFor(actor, projectId, {
      documentId,
    });

    if (!level) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }

    if (needEdit && level !== 'EDIT') {
      throw new ForbiddenException('Masz tylko podgląd tego dokumentu');
    }
  }

  private async assertFolderLevel(
    actor: AuthenticatedUser,
    projectId: string,
    folderId: string,
    needEdit: boolean,
  ) {
    const level = await this.documentAccess.levelFor(actor, projectId, {
      folderId,
    });

    if (!level) {
      throw new NotFoundException('Nie znaleziono folderu');
    }

    if (needEdit && level !== 'EDIT') {
      throw new ForbiddenException('Masz tylko podgląd tego folderu');
    }
  }

  async createDocument(
    projectId: string,
    folderId: string,
    ownerId: string,
    dto: CreateDocumentDto,
    file: UploadedFile | undefined,
    actor: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Nie wybrano pliku');
    }

    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);
    await this.assertFolderLevel(actor, projectId, folderId, true);
    await this.assertFolderExists(folderId, projectId, actor);

    const canApprove = await this.access.canManageTasks(actor, projectId);

    const asSigned = dto.asSigned === 'true';
    if (asSigned && !canApprove) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator może wgrać dokument jako podpisany',
      );
    }

    let status = 'PENDING_APPROVAL';
    if (dto.asDraft === 'true') {
      status = 'DRAFT';
    } else if (asSigned) {
      status = 'SIGNED';
    } else if (canApprove) {
      status = 'APPROVED';
    }

    const documentId = randomUUID();
    const key = `${projectId}/${documentId}/v1`;

    await this.storage.save(key, file.buffer, file.mimetype);

    const [document, version] = await this.prisma
      .$transaction([
        this.prisma.document.create({
          data: {
            id: documentId,
            projectId,
            folderId,
            name: dto.name,
            kind: dto.kind,
            status,
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
      ])
      .catch(async (error: unknown) => {
        await this.storage.remove(key).catch(() => undefined);
        throw error;
      });
    return { ...document, versions: [version] };
  }

  async createVersion(
    documentId: string,
    projectId: string,
    ownerId: string,
    dto: CreateVersionDto,
    file: UploadedFile | undefined,
    actor: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Nie wybrano pliku');
    }

    await this.access.assertCanRead(actor, projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, true);
    await this.access.assertNotArchived(projectId);

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }

    const signing = dto.markSigned === 'true';
    if (signing) {
      const canApprove = await this.access.canManageTasks(actor, projectId);
      if (!canApprove) {
        throw new ForbiddenException(
          'Tylko dyrektor lub koordynator może oznaczyć dokument jako podpisany',
        );
      }
      if (document.status !== 'APPROVED') {
        throw new BadRequestException(
          'Podpisany może być tylko zatwierdzony dokument',
        );
      }
    }

    const versionLast = await this.prisma.documentVersion.findFirst({
      where: {
        document: { projectId, id: documentId, deletedAt: null },
      },
      orderBy: { versionNo: 'desc' },
    });
    if (!versionLast) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }

    const newVersion = versionLast.versionNo + 1;
    const key = `${projectId}/${documentId}/v${newVersion}-${randomUUID().slice(0, 8)}`;
    await this.storage.save(key, file.buffer, file.mimetype);

    let nextStatus = document.status;
    if (signing) {
      nextStatus = 'SIGNED';
    } else if (document.status === 'APPROVED' || document.status === 'SIGNED') {
      nextStatus = 'PENDING_APPROVAL';
    }

    const [version] = await this.prisma
      .$transaction([
        this.prisma.documentVersion.create({
          data: {
            documentId,
            versionNo: newVersion,
            storageKey: key,
            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            uploadedById: ownerId,
            changeNote: dto.changeNote,
          },
        }),
        this.prisma.document.update({
          where: { id: documentId },
          data: { status: nextStatus },
        }),
      ])
      .catch(async (error: unknown) => {
        await this.storage.remove(key).catch(() => undefined);

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Ktoś właśnie dodał nową wersję. Odśwież stronę i spróbuj ponownie.',
          );
        }

        throw error;
      });

    return version;
  }

  async getDocuments(
    projectId: string,
    folderId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);

    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, projectId: projectId, deletedAt: null },
    });
    if (!folder) {
      throw new NotFoundException(
        'Wskazany folder nie należy do tego projektu',
      );
    }

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

      orderBy: { name: 'asc' },
    });

    const levels = await this.documentAccess.levelsForDocuments(
      actor,
      projectId,
      folderId,
      documents.map((document) => document.id),
    );

    const visible = documents
      .map((document) => ({
        ...document,
        accessLevel: levels.get(document.id) ?? null,
      }))
      .filter((document) => document.accessLevel !== null);

    // Ktoś, komu udostępniono jeden plik, folderu nie ma nadanego wcale —
    // folder jest wtedy dla niego tylko pojemnikiem na ten plik.
    if (visible.length === 0) {
      await this.assertFolderLevel(actor, projectId, folderId, false);
    }

    return visible;
  }

  async downloadDocument(
    projectId: string,
    documentId: string,
    versionNo: number,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, false);
    const version = await this.prisma.documentVersion.findFirst({
      where: {
        document: { projectId, id: documentId },
        versionNo: versionNo,
      },
    });
    if (!version) {
      throw new NotFoundException('Nie znaleziono wskazanej wersji dokumentu');
    }
    const buffer = await this.storage.read(version.storageKey);
    return { buffer, fileName: version.fileName, mimeType: version.mimeType };
  }
  async restoreDocument(
    projectId: string,
    documentId: string,
    dto: RestoreDocumentDto,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, true);
    const document = await this.prisma.document.findFirst({
      where: { projectId, id: documentId, deletedAt: { not: null } },
      include: { folder: { select: { deletedAt: true } } },
    });
    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu w Koszu');
    }

    if (dto.folderId) {
      await this.assertFolderExists(dto.folderId, projectId, actor);
      await this.assertFolderLevel(actor, projectId, dto.folderId, true);
      return await this.prisma.document.update({
        where: { id: documentId },
        data: { folderId: dto.folderId, deletedAt: null },
      });
    }

    if (document.folder.deletedAt === null) {
      return await this.prisma.document.update({
        where: { id: documentId },
        data: { deletedAt: null },
      });
    }

    throw new BadRequestException(
      'Folder tego dokumentu został usunięty, wskaż nowy',
    );
  }

  async getVersions(
    projectId: string,
    documentId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, false);
    const versions = await this.prisma.documentVersion.findMany({
      where: {
        document: { projectId, id: documentId },
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

  async restoreVersion(
    projectId: string,
    documentId: string,
    versionNo: number,
    userId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, true);
    await this.access.assertNotArchived(projectId);
    const source = await this.prisma.documentVersion.findFirst({
      where: {
        documentId,
        versionNo,
        document: { projectId, deletedAt: null },
      },
    });
    if (!source) {
      throw new NotFoundException('Nie znaleziono wersji');
    }

    const latest = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNo: 'desc' },
    });

    if (!latest || latest.storageKey === source.storageKey) {
      throw new BadRequestException('Aktualna wersja ma już tę treść');
    }

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }

    let nextStatus = document.status;
    if (document.status === 'APPROVED' || document.status === 'SIGNED') {
      nextStatus = 'PENDING_APPROVAL';
    }

    const [version] = await this.prisma
      .$transaction([
        this.prisma.documentVersion.create({
          data: {
            documentId,
            versionNo: latest.versionNo + 1,
            storageKey: source.storageKey,
            fileName: source.fileName,
            mimeType: source.mimeType,
            sizeBytes: source.sizeBytes,
            uploadedById: userId,
            changeNote: `Przywrócono wersję v${versionNo}`,
          },
        }),
        this.prisma.document.update({
          where: { id: documentId },
          data: { status: nextStatus },
        }),
      ])
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Ktoś właśnie dodał nową wersję. Odśwież stronę i spróbuj ponownie.',
          );
        }

        throw error;
      });

    return version;
  }

  async deleteDocument(
    projectId: string,
    documentId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, true);
    await this.access.assertNotArchived(projectId);
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId: projectId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException(
        'Wskazany dokument nie należy do tego projektu',
      );
    }
    const locked =
      document.status === 'APPROVED' || document.status === 'SIGNED';

    if (locked && !actor.isDirector) {
      throw new ForbiddenException(
        'Zatwierdzony lub podpisany dokument może usunąć tylko dyrektor',
      );
    }

    return await this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });
  }

  async updateDocument(
    projectId: string,
    documentId: string,
    dto: UpdateDocumentDto,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, true);
    await this.access.assertNotArchived(projectId);
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId: projectId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }
    return await this.prisma.document.update({
      where: { id: documentId },
      data: { name: dto.name },
    });
  }

  async approveDocument(
    projectId: string,
    documentId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);

    const canApprove = await this.access.canManageTasks(actor, projectId);

    if (!canApprove) {
      throw new ForbiddenException(
        'Tylko dyrektor lub koordynator projektu może akceptować dokumenty',
      );
    }

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId: projectId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }

    if (document.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Ten dokument nie czeka na akceptację');
    }

    return await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'APPROVED' },
    });
  }
  async submitForApproval(
    projectId: string,
    documentId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);
    await this.assertDocumentLevel(actor, projectId, documentId, true);

    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId: projectId, deletedAt: null },
    });
    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu');
    }

    if (document.status !== 'DRAFT') {
      throw new BadRequestException('Ten dokument nie jest roboczy');
    }

    const canApprove = await this.access.canManageTasks(actor, projectId);

    return await this.prisma.document.update({
      where: { id: documentId },
      data: { status: canApprove ? 'APPROVED' : 'PENDING_APPROVAL' },
    });
  }

  async getTrash(projectId: string, actor: AuthenticatedUser) {
    await this.access.assertCanRead(actor, projectId);

    const documents = await this.prisma.document.findMany({
      where: { projectId: projectId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: {
        versions: {
          orderBy: { versionNo: 'desc' },
          take: 1,
          include: {
            uploadedBy: { select: { firstName: true, lastName: true } },
          },
        },
        folder: { select: { name: true, deletedAt: true } },
      },
    });

    const canManage = await this.access.canManageTasks(actor, projectId);
    if (canManage) {
      return documents.map((document) => ({
        ...document,
        accessLevel: 'EDIT',
      }));
    }

    const visible = [];
    for (const document of documents) {
      const level = await this.documentAccess.levelFor(actor, projectId, {
        documentId: document.id,
      });
      if (level) {
        visible.push({ ...document, accessLevel: level });
      }
    }

    return visible;
  }

  async deleteDocumentPermanently(
    projectId: string,
    documentId: string,
    actor: AuthenticatedUser,
  ) {
    await this.access.assertCanRead(actor, projectId);
    await this.access.assertNotArchived(projectId);
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, projectId: projectId, deletedAt: { not: null } },
      include: { versions: true },
    });

    if (!document) {
      throw new NotFoundException('Nie znaleziono dokumentu w Koszu');
    }

    await this.prisma.$transaction([
      this.prisma.documentAccess.deleteMany({ where: { documentId } }),
      this.prisma.documentVersion.deleteMany({ where: { documentId } }),
      this.prisma.document.delete({ where: { id: documentId } }),
    ]);

    for (const version of document.versions) {
      await this.storage.remove(version.storageKey);
    }
  }

  async countPendingApproval(projectId: string, actor: AuthenticatedUser) {
    await this.access.assertCanRead(actor, projectId);

    const canApprove = await this.access.canManageTasks(actor, projectId);
    if (!canApprove) {
      return { count: 0 };
    }

    const count = await this.prisma.document.count({
      where: { projectId, status: 'PENDING_APPROVAL', deletedAt: null },
    });
    return { count };
  }
}
