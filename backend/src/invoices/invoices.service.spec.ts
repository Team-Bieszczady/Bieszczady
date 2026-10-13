import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { InvoicesService } from './invoices.service';

describe('InvoicesService', () => {
  let service: InvoicesService;

  const prisma = {
    invoice: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const projectAccess = { assertNotArchived: jest.fn() };

  const creator = { id: 'director-1' };

  const savedShares = [
    {
      id: 'share-1',
      amount: { toString: () => '600' },
      project: { id: 'project-1', name: 'Festiwal' },
    },
    {
      id: 'share-2',
      amount: { toString: () => '400' },
      project: { id: 'project-2', name: 'Świetlica' },
    },
  ];

  const savedInvoice = {
    id: 'invoice-1',
    name: 'Faktura za druk ulotek',
    amount: { toString: () => '1000' },
    paymentDate: new Date('2026-10-20'),
    status: 'TO_PAY',
    createdAt: new Date('2026-10-12'),
    shares: savedShares,
    documents: [],
  };

  const newInvoice = {
    name: 'Faktura za druk ulotek',
    amount: '1000',
    paymentDate: '2026-10-20',
    shares: [
      { projectId: 'project-1', amount: '600' },
      { projectId: 'project-2', amount: '400' },
    ],
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProjectAccessService, useValue: projectAccess },
      ],
    }).compile();

    service = module.get(InvoicesService);
    prisma.invoice.findMany.mockResolvedValue([]);
    prisma.invoice.findFirst.mockResolvedValue({ id: 'invoice-1' });
    prisma.invoice.create.mockResolvedValue(savedInvoice);
    prisma.invoice.update.mockResolvedValue(savedInvoice);
  });

  describe('findAll', () => {
    it('turns the Decimal amounts into plain strings for the API', async () => {
      prisma.invoice.findMany.mockResolvedValue([savedInvoice]);

      const result = await service.findAll({});

      expect(result[0].amount).toBe('1000');
      expect(result[0].shares[0]).toEqual({
        id: 'share-1',
        projectId: 'project-1',
        projectName: 'Festiwal',
        amount: '600',
      });
    });

    it('filters by status and project when asked', async () => {
      await service.findAll({ status: 'PAID', projectId: 'project-1' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            status: 'PAID',
            shares: { some: { projectId: 'project-1' } },
          },
        }),
      );
    });
  });

  describe('create', () => {
    it('saves an invoice split across projects', async () => {
      await service.create(newInvoice, creator);

      expect(projectAccess.assertNotArchived).toHaveBeenCalledWith('project-1');
      expect(projectAccess.assertNotArchived).toHaveBeenCalledWith('project-2');
      const [createArgs] = prisma.invoice.create.mock.calls[0] as [
        { data: { createdById: string } },
      ];
      expect(createArgs.data.createdById).toBe('director-1');
    });

    it('rejects shares that do not add up to the invoice amount', async () => {
      await expect(
        service.create(
          {
            ...newInvoice,
            shares: [{ projectId: 'project-1', amount: '500' }],
          },
          creator,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('rejects the same project listed twice', async () => {
      await expect(
        service.create(
          {
            ...newInvoice,
            shares: [
              { projectId: 'project-1', amount: '600' },
              { projectId: 'project-1', amount: '400' },
            ],
          },
          creator,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('refuses a share on an archived project', async () => {
      projectAccess.assertNotArchived.mockRejectedValue(
        new Error('Projekt jest zarchiwizowany'),
      );

      await expect(service.create(newInvoice, creator)).rejects.toThrow(
        'Projekt jest zarchiwizowany',
      );
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('answers 404 for an invoice that does not exist', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.update('invoice-1', newInvoice)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('replaces the project split', async () => {
      await service.update('invoice-1', newInvoice);

      const [updateArgs] = prisma.invoice.update.mock.calls[0] as [
        { data: { shares: unknown } },
      ];
      expect(updateArgs.data.shares).toEqual({
        deleteMany: {},
        create: [
          { projectId: 'project-1', amount: '600' },
          { projectId: 'project-2', amount: '400' },
        ],
      });
    });
  });

  describe('updateStatus', () => {
    it('marks an invoice as paid', async () => {
      await service.updateStatus('invoice-1', { status: 'PAID' });

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'invoice-1' },
          data: { status: 'PAID' },
        }),
      );
    });

    it('answers 404 for an invoice that does not exist', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('invoice-1', { status: 'PAID' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes the invoice', async () => {
      await service.remove('invoice-1');

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'invoice-1' },
        data: { deletedAt: expect.any(Date) as Date },
      });
    });

    it('answers 404 for an invoice that does not exist', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(service.remove('invoice-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
