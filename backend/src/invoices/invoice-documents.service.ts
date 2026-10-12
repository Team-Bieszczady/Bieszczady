import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { StorageService } from '../documents/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export const INVOICE_FOLDER_NAME = 'Faktury';

@Injectable()
export class InvoiceDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async upload(
    invoiceId: string,
    file: UploadedFile | undefined,
    actor: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('Nie wybrano pliku');

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, deletedAt: null },
      select: {
        id: true,
        name: true,
        shares: { select: { projectId: true } },
        documents: { select: { id: true } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Nie znaleziono faktury');
    }
    if (invoice.documents.length > 0) {
      throw new BadRequestException('Ta faktura ma już wgrany plik');
    }

    // Plik trafia do Dokumentów każdego projektu z podziału, bo każdy z nich
    // rozlicza się ze swojej części osobno.
    for (const share of invoice.shares) {
      await this.addToProject(invoice, share.projectId, file, actor);
    }
  }

  async remove(invoiceId: string, actor: AuthenticatedUser) {
    const links = await this.prisma.invoiceDocument.findMany({
      where: { invoiceId, document: { deletedAt: null } },
      select: { document: { select: { id: true, status: true } } },
    });
    if (links.length === 0) {
      throw new NotFoundException('Ta faktura nie ma wgranego pliku');
    }

    const locked = links.some(
      (link) =>
        link.document.status === 'APPROVED' ||
        link.document.status === 'SIGNED',
    );
    if (locked && !actor.isDirector) {
      throw new BadRequestException(
        'Zatwierdzony dokument może usunąć tylko dyrektor',
      );
    }

    await this.prisma.document.updateMany({
      where: { id: { in: links.map((link) => link.document.id) } },
      data: { deletedAt: new Date() },
    });
  }

  private async addToProject(
    invoice: { id: string; name: string },
    projectId: string,
    file: UploadedFile,
    actor: AuthenticatedUser,
  ) {
    const folderId = await this.invoiceFolderId(projectId, actor.id);
    const approves = await this.projectAccess.canManageTasks(actor, projectId);

    const documentId = randomUUID();
    const storageKey = `${projectId}/${documentId}/v1`;
    await this.storage.save(storageKey, file.buffer, file.mimetype);

    await this.prisma.invoiceDocument
      .create({
        data: {
          invoice: { connect: { id: invoice.id } },
          document: {
            create: {
              id: documentId,
              projectId,
              folderId,
              name: `Faktura – ${invoice.name}`,
              kind: 'INVOICE',
              status: approves ? 'APPROVED' : 'PENDING_APPROVAL',
              ownerId: actor.id,
              versions: {
                create: {
                  versionNo: 1,
                  storageKey,
                  fileName: file.originalname,
                  mimeType: file.mimetype,
                  sizeBytes: file.size,
                  uploadedById: actor.id,
                },
              },
            },
          },
        },
      })
      .catch(async (error: unknown) => {
        await this.storage.remove(storageKey).catch(() => undefined);
        throw error;
      });
  }

  private async invoiceFolderId(projectId: string, ownerId: string) {
    const existing = await this.prisma.folder.findFirst({
      where: {
        projectId,
        parentId: null,
        name: INVOICE_FOLDER_NAME,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await this.prisma.folder.create({
      data: { projectId, name: INVOICE_FOLDER_NAME, ownerId },
      select: { id: true },
    });
    return created.id;
  }
}
