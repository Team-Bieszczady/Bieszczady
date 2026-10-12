import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { type AuthenticatedUser } from '../auth/types/auth.types';
import { StorageService } from '../documents/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { InvoiceDocumentsService } from './invoice-documents.service';

describe('InvoiceDocumentsService', () => {
  let service: InvoiceDocumentsService;

  const prisma = {
    invoice: { findFirst: jest.fn() },
    invoiceDocument: { create: jest.fn(), findMany: jest.fn() },
    folder: { findFirst: jest.fn(), create: jest.fn() },
    document: { updateMany: jest.fn() },
  };
  const storage = { save: jest.fn(), remove: jest.fn() };
  const projectAccess = { canManageTasks: jest.fn() };

  const user = { id: 'user-1', isDirector: false } as AuthenticatedUser;
  const director = { id: 'director-1', isDirector: true } as AuthenticatedUser;
  const file = {
    buffer: Buffer.from('faktura'),
    originalname: 'faktura.pdf',
    mimetype: 'application/pdf',
    size: 7,
  };

  const splitInvoice = {
    id: 'invoice-1',
    name: 'Druk ulotek',
    shares: [{ projectId: 'project-1' }, { projectId: 'project-2' }],
    documents: [],
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceDocumentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: ProjectAccessService, useValue: projectAccess },
      ],
    }).compile();

    service = module.get(InvoiceDocumentsService);
    prisma.invoice.findFirst.mockResolvedValue(splitInvoice);
    prisma.folder.findFirst.mockResolvedValue({ id: 'folder-1' });
    prisma.invoiceDocument.create.mockResolvedValue({ id: 'link-1' });
    projectAccess.canManageTasks.mockResolvedValue(false);
    storage.save.mockResolvedValue(undefined);
    storage.remove.mockResolvedValue(undefined);
  });

  describe('upload', () => {
    it('refuses a request without a file', async () => {
      await expect(
        service.upload('invoice-1', undefined, user),
      ).rejects.toThrow(BadRequestException);
    });

    it('answers 404 for an invoice that does not exist', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.upload('invoice-1', file, user)).rejects.toThrow(
        NotFoundException,
      );
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('puts the file in the Documents of every project on the split', async () => {
      await service.upload('invoice-1', file, user);

      expect(storage.save).toHaveBeenCalledTimes(2);
      expect(prisma.invoiceDocument.create).toHaveBeenCalledTimes(2);
      const [firstCall] = prisma.invoiceDocument.create.mock.calls[0] as [
        { data: { document: { create: { projectId: string; kind: string } } } },
      ];
      expect(firstCall.data.document.create.projectId).toBe('project-1');
      expect(firstCall.data.document.create.kind).toBe('INVOICE');
    });

    it('marks the document as waiting for approval when the person cannot approve', async () => {
      await service.upload('invoice-1', file, user);

      const [firstCall] = prisma.invoiceDocument.create.mock.calls[0] as [
        { data: { document: { create: { status: string } } } },
      ];
      expect(firstCall.data.document.create.status).toBe('PENDING_APPROVAL');
    });

    it('approves the document straight away for a coordinator', async () => {
      projectAccess.canManageTasks.mockResolvedValue(true);

      await service.upload('invoice-1', file, user);

      const [firstCall] = prisma.invoiceDocument.create.mock.calls[0] as [
        { data: { document: { create: { status: string } } } },
      ];
      expect(firstCall.data.document.create.status).toBe('APPROVED');
    });

    it('creates the invoice folder when the project has none yet', async () => {
      prisma.folder.findFirst.mockResolvedValue(null);
      prisma.folder.create.mockResolvedValue({ id: 'new-folder' });

      await service.upload('invoice-1', file, user);

      const [folderArgs] = prisma.folder.create.mock.calls[0] as [
        { data: { name: string } },
      ];
      expect(folderArgs.data.name).toBe('Faktury');
    });

    it('refuses a second file for the same invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue({
        ...splitInvoice,
        documents: [{ id: 'link-1' }],
      });

      await expect(service.upload('invoice-1', file, user)).rejects.toThrow(
        BadRequestException,
      );
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('cleans the stored file up when saving the document fails', async () => {
      prisma.invoiceDocument.create.mockRejectedValue(new Error('zapis padł'));

      await expect(service.upload('invoice-1', file, user)).rejects.toThrow(
        'zapis padł',
      );
      expect(storage.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('answers 404 when the invoice has no file', async () => {
      prisma.invoiceDocument.findMany.mockResolvedValue([]);

      await expect(service.remove('invoice-1', user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('refuses to let anyone but a director remove an approved document', async () => {
      prisma.invoiceDocument.findMany.mockResolvedValue([
        { document: { id: 'doc-1', status: 'APPROVED' } },
      ]);

      await expect(service.remove('invoice-1', user)).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.document.updateMany).not.toHaveBeenCalled();
    });

    it('lets a director remove an approved document', async () => {
      prisma.invoiceDocument.findMany.mockResolvedValue([
        { document: { id: 'doc-1', status: 'APPROVED' } },
      ]);

      await service.remove('invoice-1', director);

      expect(prisma.document.updateMany).toHaveBeenCalled();
    });

    it('removes the copy from every project at once', async () => {
      prisma.invoiceDocument.findMany.mockResolvedValue([
        { document: { id: 'doc-1', status: 'PENDING_APPROVAL' } },
        { document: { id: 'doc-2', status: 'PENDING_APPROVAL' } },
      ]);

      await service.remove('invoice-1', user);

      const [args] = prisma.document.updateMany.mock.calls[0] as [
        { where: { id: { in: string[] } } },
      ];
      expect(args.where.id.in).toEqual(['doc-1', 'doc-2']);
    });
  });
});
