import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { ListInvoicesQueryDto } from './dto/list-invoices-query.dto';
import { InvoiceShareDto } from './dto/invoice-share.dto';

type Viewer = { id: string };

const SAVED_FIELDS = {
  id: true,
  name: true,
  amount: true,
  paymentDate: true,
  status: true,
  createdAt: true,
  shares: {
    select: {
      id: true,
      amount: true,
      project: { select: { id: true, name: true } },
    },
  },
  documents: {
    where: { document: { deletedAt: null } },
    select: {
      document: {
        select: {
          id: true,
          folderId: true,
          projectId: true,
          name: true,
          status: true,
          versions: {
            orderBy: { versionNo: 'desc' },
            take: 1,
            select: { fileName: true, versionNo: true, mimeType: true },
          },
        },
      },
    },
  },
} satisfies Prisma.InvoiceSelect;

type SavedInvoice = Prisma.InvoiceGetPayload<{ select: typeof SAVED_FIELDS }>;

function toInvoiceView(invoice: SavedInvoice) {
  return {
    id: invoice.id,
    name: invoice.name,
    amount: invoice.amount.toString(),
    paymentDate: invoice.paymentDate,
    status: invoice.status,
    createdAt: invoice.createdAt,
    shares: invoice.shares.map((share) => ({
      id: share.id,
      projectId: share.project.id,
      projectName: share.project.name,
      amount: share.amount.toString(),
    })),
    documents: invoice.documents.map((link) => ({
      id: link.document.id,
      projectId: link.document.projectId,
      folderId: link.document.folderId,
      name: link.document.name,
      status: link.document.status,
      fileName: link.document.versions[0]
        ? link.document.versions[0].fileName
        : '',
      versionNo: link.document.versions[0]
        ? link.document.versions[0].versionNo
        : 0,
      mimeType: link.document.versions[0]
        ? link.document.versions[0].mimeType
        : '',
    })),
  };
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async findAll(query: ListInvoicesQueryDto) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        deletedAt: null,
        status: query.status,
        shares: query.projectId
          ? { some: { projectId: query.projectId } }
          : undefined,
      },
      orderBy: [{ paymentDate: 'asc' }, { createdAt: 'asc' }],
      select: SAVED_FIELDS,
    });

    return invoices.map(toInvoiceView);
  }

  async create(dto: CreateInvoiceDto, creator: Viewer) {
    await this.assertSharesValid(dto.amount, dto.shares);

    const invoice = await this.prisma.invoice.create({
      data: {
        name: dto.name,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        createdById: creator.id,
        shares: {
          create: dto.shares.map((share) => ({
            projectId: share.projectId,
            amount: share.amount,
          })),
        },
      },
      select: SAVED_FIELDS,
    });

    return toInvoiceView(invoice);
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    await this.findExisting(id);
    await this.assertSharesValid(dto.amount, dto.shares);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        name: dto.name,
        amount: dto.amount,
        paymentDate: new Date(dto.paymentDate),
        shares: {
          deleteMany: {},
          create: dto.shares.map((share) => ({
            projectId: share.projectId,
            amount: share.amount,
          })),
        },
      },
      select: SAVED_FIELDS,
    });

    return toInvoiceView(invoice);
  }

  async updateStatus(id: string, dto: UpdateInvoiceStatusDto) {
    await this.findExisting(id);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: dto.status },
      select: SAVED_FIELDS,
    });

    return toInvoiceView(invoice);
  }

  async remove(id: string) {
    await this.findExisting(id);

    await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findExisting(id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!invoice) {
      throw new NotFoundException('Nie znaleziono faktury');
    }
    return invoice;
  }

  private async assertSharesValid(amount: string, shares: InvoiceShareDto[]) {
    const projectIds = shares.map((share) => share.projectId);
    if (new Set(projectIds).size !== projectIds.length) {
      throw new BadRequestException(
        'Każdy projekt może wystąpić na fakturze tylko raz',
      );
    }

    for (const projectId of projectIds) {
      await this.projectAccess.assertNotArchived(projectId);
    }

    const total = shares.reduce(
      (sum, share) => sum.plus(share.amount),
      new Prisma.Decimal(0),
    );
    if (!total.equals(new Prisma.Decimal(amount))) {
      throw new BadRequestException(
        'Kwoty przypisane do projektów muszą się sumować do kwoty faktury',
      );
    }
  }
}
