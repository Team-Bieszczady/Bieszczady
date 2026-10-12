import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { ATTENDED_MEETING } from './attended-meeting';
import { DuplicateParticipantsQueryDto } from './dto/duplicate-participants-query.dto';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from './dto/participant.dto';

const SAVED_FIELDS = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  address: true,
  note: true,
  consentAt: true,
};

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccess: ProjectAccessService,
  ) {}

  async findAll(query: ListParticipantsQueryDto) {
    const participants = await this.prisma.participant.findMany({
      where: {
        deletedAt: null,
        AND: this.searchConditions(query.search),
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        note: true,
        consentAt: true,
        _count: {
          select: { meetings: { where: { meeting: ATTENDED_MEETING } } },
        },
      },
    });

    return participants.map((participant) => ({
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      phone: participant.phone,
      address: participant.address,
      note: participant.note,
      consentAt: participant.consentAt,
      meetingCount: participant._count.meetings,
    }));
  }

  async findDuplicates(query: DuplicateParticipantsQueryDto) {
    const matchesEither: Prisma.ParticipantWhereInput[] = [];

    if (query.email) {
      matchesEither.push({ email: query.email });
    }

    if (query.firstName && query.lastName) {
      matchesEither.push({
        firstName: query.firstName,
        lastName: query.lastName,
      });
    }

    if (matchesEither.length === 0) {
      return [];
    }

    return this.prisma.participant.findMany({
      where: {
        deletedAt: null,
        id: query.excludeId ? { not: query.excludeId } : undefined,
        OR: matchesEither,
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: { id: true, firstName: true, lastName: true, email: true },
    });
  }

  async findByProject(projectId: string, viewer: AuthenticatedUser) {
    await this.projectAccess.assertCanRead(viewer, projectId);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
    if (!project) {
      throw new NotFoundException('Nie znaleziono projektu');
    }

    const attendedInProject: Prisma.MeetingWhereInput = {
      ...ATTENDED_MEETING,
      projectId,
    };

    const participants = await this.prisma.participant.findMany({
      where: {
        deletedAt: null,
        meetings: { some: { meeting: attendedInProject } },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        _count: {
          select: { meetings: { where: { meeting: attendedInProject } } },
        },
      },
    });

    return {
      projectName: project.name,
      participants: participants.map((participant) => ({
        id: participant.id,
        firstName: participant.firstName,
        lastName: participant.lastName,
        email: participant.email,
        phone: participant.phone,
        address: participant.address,
        meetingCount: participant._count.meetings,
      })),
    };
  }

  async create(dto: CreateParticipantDto, creatorId: string) {
    return this.prisma.participant.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        note: dto.note || '',
        consentAt: this.consentDate(dto.hasConsent, null),
        createdById: creatorId,
      },
      select: SAVED_FIELDS,
    });
  }

  async update(id: string, dto: UpdateParticipantDto) {
    const existing = await this.findExisting(id);

    return this.prisma.participant.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        note: dto.note || '',
        consentAt: this.consentDate(dto.hasConsent, existing.consentAt),
      },
      select: SAVED_FIELDS,
    });
  }

  async remove(id: string) {
    await this.findExisting(id);

    await this.prisma.participant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private async findExisting(id: string) {
    const participant = await this.prisma.participant.findFirst({
      where: { id, deletedAt: null },
      select: { consentAt: true },
    });

    if (!participant) {
      throw new NotFoundException('Nie znaleziono uczestnika');
    }

    return participant;
  }

  private searchConditions(search: string | undefined) {
    if (!search) {
      return [];
    }

    const words = search.split(' ').filter((word) => word !== '');

    return words.map((word) => ({
      OR: [
        { firstName: { startsWith: word } },
        { lastName: { startsWith: word } },
        { lastName: { contains: `-${word}` } },
        { email: { startsWith: word } },
      ],
    }));
  }

  private consentDate(hasConsent: boolean, previousDate: Date | null) {
    if (!hasConsent) {
      return null;
    }

    if (previousDate) {
      return previousDate;
    }

    return new Date();
  }
}
