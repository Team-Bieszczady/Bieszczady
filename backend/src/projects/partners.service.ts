import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import { NO_AGREEMENT } from '../common/enums/project.enums';
import { CreatePartnerDto, UpdatePartnerDto } from './dto/partner.dto';

const PARTNER_INCLUDE = {
  projects: {
    select: { project: { select: { id: true, name: true } } },
    orderBy: { project: { name: 'asc' } },
  },
} satisfies Prisma.PartnerInclude;

type PartnerRow = Prisma.PartnerGetPayload<{ include: typeof PARTNER_INCLUDE }>;

@Injectable()
export class PartnersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const partners = await this.prisma.partner.findMany({
      include: PARTNER_INCLUDE,
      orderBy: { name: 'asc' },
    });
    return partners.map((partner) => this.toResponse(partner));
  }

  async findOne(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: PARTNER_INCLUDE,
    });
    if (!partner) throw new NotFoundException('Nie znaleziono partnera');
    return this.toResponse(partner);
  }

  async create(dto: CreatePartnerDto) {
    return this.prisma.$transaction(async (tx) => {
      const projectIds = dto.projectIds ?? [];
      await this.assertProjectsExist(projectIds, tx);

      const partner = await tx.partner.create({
        data: {
          name: dto.name,
          type: dto.type,
          nip: dto.nip ?? '',
          city: dto.city ?? '',
          email: dto.email ?? '',
          contactName: dto.contactName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone ?? '',
          agreement: dto.agreement,
          agreementValidUntil:
            dto.agreement === NO_AGREEMENT || !dto.agreementValidUntil
              ? null
              : new Date(dto.agreementValidUntil),
          status: dto.status ?? 'ACTIVE',
          projects: {
            create: projectIds.map((projectId) => ({ projectId })),
          },
        },
        include: PARTNER_INCLUDE,
      });
      return this.toResponse(partner);
    }, SERIALIZABLE);
  }

  async update(id: string, dto: UpdatePartnerDto) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.partner.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException('Nie znaleziono partnera');
      if (dto.projectIds !== undefined) {
        await this.assertProjectsExist(dto.projectIds, tx);
        const inBudget = await tx.budgetCategory.count({
          where: {
            partnerId: id,
            version: { projectId: { notIn: dto.projectIds } },
          },
        });
        if (inBudget > 0) {
          throw new ConflictException(
            'Partner realizuje kategorię w budżecie projektu, którego nie można odpiąć',
          );
        }
      }

      const data: Prisma.PartnerUpdateInput = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.type !== undefined) data.type = dto.type;
      if (dto.nip !== undefined) data.nip = dto.nip;
      if (dto.city !== undefined) data.city = dto.city;
      if (dto.email !== undefined) data.email = dto.email;
      if (dto.contactName !== undefined) data.contactName = dto.contactName;
      if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail;
      if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
      if (dto.agreement !== undefined) data.agreement = dto.agreement;
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.agreementValidUntil !== undefined) {
        data.agreementValidUntil = dto.agreementValidUntil
          ? new Date(dto.agreementValidUntil)
          : null;
      }
      if ((dto.agreement ?? existing.agreement) === NO_AGREEMENT) {
        data.agreementValidUntil = null;
      }

      if (dto.projectIds !== undefined) {
        await tx.partnerProject.deleteMany({ where: { partnerId: id } });
        if (dto.projectIds.length > 0) {
          await tx.partnerProject.createMany({
            data: dto.projectIds.map((projectId) => ({
              partnerId: id,
              projectId,
            })),
          });
        }
      }

      const partner = await tx.partner.update({
        where: { id },
        data,
        include: PARTNER_INCLUDE,
      });
      return this.toResponse(partner);
    }, SERIALIZABLE);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const partner = await tx.partner.findUnique({ where: { id } });
      if (!partner) throw new NotFoundException('Nie znaleziono partnera');

      const [categories, members] = await Promise.all([
        tx.budgetCategory.count({ where: { partnerId: id } }),
        tx.projectMember.count({ where: { partnerId: id } }),
      ]);
      if (categories > 0 || members > 0) {
        throw new ConflictException(
          'Partner jest przypisany do budżetu lub członków projektu — ustaw status Zatrzymany',
        );
      }

      await tx.partnerProject.deleteMany({ where: { partnerId: id } });
      await tx.partner.delete({ where: { id } });
    }, SERIALIZABLE);
  }

  private async assertProjectsExist(
    projectIds: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (projectIds.length === 0) return;
    const found = await tx.project.count({ where: { id: { in: projectIds } } });
    if (found !== projectIds.length) {
      throw new ConflictException('Nie znaleziono projektu');
    }
  }

  private toResponse(partner: PartnerRow) {
    const { projects, agreementValidUntil, ...rest } = partner;
    return {
      ...rest,
      agreementValidUntil: agreementValidUntil
        ? agreementValidUntil.toISOString().slice(0, 10)
        : '',
      projects: projects.map((link) => link.project),
    };
  }
}
