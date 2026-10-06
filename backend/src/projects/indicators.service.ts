import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SERIALIZABLE } from '../prisma/transaction-options';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import type { IndicatorScope } from '../common/enums/project.enums';
import { PERSON_SELECT } from './prisma-selects';
import { ProjectAccessService } from './project-access.service';
import {
  CreateIndicatorDto,
  IndicatorProgressDto,
  UpdateIndicatorDto,
} from './dto/indicator.dto';

type Db = Prisma.TransactionClient;

const STAGE_SELECT = {
  select: { id: true, name: true, deadline: true },
} satisfies { select: Prisma.StageSelect };

const INDICATOR_INCLUDE = {
  owner: PERSON_SELECT,
  stage: STAGE_SELECT,
  task: {
    select: {
      id: true,
      title: true,
      dueDate: true,
      activity: { select: { stage: STAGE_SELECT } },
    },
  },
  folders: { select: { folderId: true } },
  project: { select: { plannedEndDate: true } },
} satisfies Prisma.IndicatorInclude;

type IndicatorRow = Prisma.IndicatorGetPayload<{
  include: typeof INDICATOR_INCLUDE;
}>;

type FolderNode = { id: string; name: string; parentId: string | null };

type FolderAccess =
  'all' | 'none' | { granted: Set<string>; holding: Set<string> };

function isFolderVisible(
  folder: FolderNode,
  byId: Map<string, FolderNode>,
  access: { granted: Set<string>; holding: Set<string> },
): boolean {
  if (access.holding.has(folder.id)) return true;

  const seen = new Set<string>();
  let current: FolderNode | undefined = folder;
  while (current && !seen.has(current.id)) {
    if (access.granted.has(current.id)) return true;
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

export function indicatorPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export function indicatorDeadline(
  indicator: Pick<IndicatorRow, 'scope' | 'stage' | 'task' | 'project'>,
): { deadline: Date | null; deadlineSource: string } {
  const { scope, stage, task, project } = indicator;

  if (scope === 'STAGE' && task) {
    if (task.dueDate) {
      return {
        deadline: task.dueDate,
        deadlineSource: `koniec zadania „${task.title}”`,
      };
    }
    return {
      deadline: task.activity.stage.deadline,
      deadlineSource: `koniec etapu „${task.activity.stage.name}”`,
    };
  }
  if (scope === 'STAGE' && stage) {
    return {
      deadline: stage.deadline,
      deadlineSource: `koniec etapu „${stage.name}”`,
    };
  }
  return {
    deadline: project.plannedEndDate,
    deadlineSource: 'koniec projektu',
  };
}

function folderPath(folder: FolderNode, byId: Map<string, FolderNode>): string {
  const names: string[] = [];
  const seen = new Set<string>([folder.id]);
  let parentId = folder.parentId;

  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId);
    if (!parent) break;
    names.unshift(parent.name);
    seen.add(parent.id);
    parentId = parent.parentId;
  }
  return names.join(' / ');
}

@Injectable()
export class IndicatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  private async folderAccess(
    viewer: AuthenticatedUser,
    projectId: string,
    db: Db,
  ): Promise<FolderAccess> {
    if (await this.access.canManageTasks(viewer, projectId, db)) return 'all';
    if (!viewer.modules.includes('DOCUMENTS')) return 'none';

    const grants = await db.documentAccess.findMany({
      where: { projectId, userId: viewer.id },
      select: { folderId: true, documentId: true },
    });
    const documentIds = grants.flatMap(({ documentId }) =>
      documentId ? [documentId] : [],
    );
    const holding = documentIds.length
      ? await db.document.findMany({
          where: { id: { in: documentIds }, deletedAt: null },
          select: { folderId: true },
        })
      : [];

    return {
      granted: new Set(
        grants.flatMap(({ folderId }) => (folderId ? [folderId] : [])),
      ),
      holding: new Set(holding.map(({ folderId }) => folderId)),
    };
  }

  private async toResponses(
    db: Db,
    projectId: string,
    rows: IndicatorRow[],
    access: FolderAccess,
  ) {
    const folders =
      access === 'none'
        ? []
        : await db.folder.findMany({
            where: { projectId, deletedAt: null },
            select: { id: true, name: true, parentId: true },
          });
    const allById = new Map(folders.map((folder) => [folder.id, folder]));
    const byId =
      access === 'all' || access === 'none'
        ? allById
        : new Map(
            folders
              .filter((folder) => isFolderVisible(folder, allById, access))
              .map((folder) => [folder.id, folder]),
          );

    return rows.map((row) => {
      const { deadline, deadlineSource } = indicatorDeadline(row);
      const stage = row.stage ?? row.task?.activity.stage ?? null;

      return {
        id: row.id,
        projectId: row.projectId,
        name: row.name,
        description: row.description,
        targetValue: row.targetValue,
        currentValue: row.currentValue,
        percent: indicatorPercent(row.currentValue, row.targetValue),
        scope: row.scope as IndicatorScope,
        stage: stage && { id: stage.id, name: stage.name },
        task: row.task && { id: row.task.id, title: row.task.title },
        deadline,
        deadlineSource,
        owner: row.owner,
        folders: row.folders.flatMap(({ folderId }) => {
          const folder = byId.get(folderId);
          if (!folder) return [];
          return [
            {
              id: folder.id,
              name: folder.name,
              path: folderPath(folder, byId),
            },
          ];
        }),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });
  }

  private async toResponse(db: Db, id: string) {
    const row = await db.indicator.findUniqueOrThrow({
      where: { id },
      include: INDICATOR_INCLUDE,
    });
    const [response] = await this.toResponses(db, row.projectId, [row], 'all');
    return response;
  }

  private async findOrThrow(db: Db, id: string) {
    const indicator = await db.indicator.findUnique({ where: { id } });
    if (!indicator) throw new NotFoundException('Nie znaleziono wskaźnika');
    return indicator;
  }

  private async resolveAssignment(
    db: Db,
    projectId: string,
    scope: IndicatorScope,
    stageId: string | null | undefined,
    taskId: string | null | undefined,
  ): Promise<{ stageId: string | null; taskId: string | null }> {
    if (scope === 'PROJECT') return { stageId: null, taskId: null };

    if (!stageId === !taskId) {
      throw new BadRequestException(
        'Wskaż etap albo zadanie, z którym kończy się wskaźnik',
      );
    }

    if (stageId) {
      const stage = await db.stage.findUnique({
        where: { id: stageId },
        select: { projectId: true },
      });
      if (!stage) throw new NotFoundException('Nie znaleziono etapu');
      if (stage.projectId !== projectId) {
        throw new ConflictException('Wybrany etap należy do innego projektu');
      }
      return { stageId, taskId: null };
    }

    const task = await this.access.locateTask(taskId!, db);
    if (task.projectId !== projectId) {
      throw new ConflictException('Wybrane zadanie należy do innego projektu');
    }
    return { stageId: null, taskId: taskId! };
  }

  private async assertFoldersInProject(
    db: Db,
    projectId: string,
    folderIds: string[],
  ): Promise<string[]> {
    const unique = [...new Set(folderIds)];
    if (unique.length === 0) return unique;

    const found = await db.folder.count({
      where: { id: { in: unique }, projectId, deletedAt: null },
    });
    if (found !== unique.length) {
      throw new ConflictException(
        'Wybrany folder nie istnieje w dokumentach tego projektu',
      );
    }
    return unique;
  }

  private async assertOwnerIsMember(
    db: Db,
    projectId: string,
    userId: string | null | undefined,
  ): Promise<void> {
    if (!userId) return;

    const member = await db.projectMember.count({
      where: { projectId, userId },
    });
    if (member === 0) {
      throw new ConflictException(
        'Osoba odpowiedzialna musi być członkiem projektu',
      );
    }
  }

  private static assertValueWithinTarget(current: number, target: number) {
    if (current > target) {
      throw new ConflictException(
        'Wartość zrealizowana nie może być większa niż wartość docelowa',
      );
    }
  }

  async findAllForProject(projectId: string, viewer: AuthenticatedUser) {
    await this.access.assertCanRead(viewer, projectId);

    const rows = await this.prisma.indicator.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: INDICATOR_INCLUDE,
    });
    const access = await this.folderAccess(viewer, projectId, this.prisma);
    return this.toResponses(this.prisma, projectId, rows, access);
  }

  async create(
    projectId: string,
    dto: CreateIndicatorDto,
    actor: AuthenticatedUser,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await this.access.assertCanManageIndicators(actor, projectId, tx);
      await this.access.assertNotArchived(projectId, tx);

      const currentValue = dto.currentValue ?? 0;
      IndicatorsService.assertValueWithinTarget(currentValue, dto.targetValue);
      const assignment = await this.resolveAssignment(
        tx,
        projectId,
        dto.scope,
        dto.stageId,
        dto.taskId,
      );
      const folderIds = await this.assertFoldersInProject(
        tx,
        projectId,
        dto.folderIds ?? [],
      );
      await this.assertOwnerIsMember(tx, projectId, dto.ownerId);

      const created = await tx.indicator.create({
        data: {
          projectId,
          name: dto.name,
          description: dto.description ?? '',
          targetValue: dto.targetValue,
          currentValue,
          scope: dto.scope,
          ...assignment,
          ownerId: dto.ownerId ?? null,
          folders: { create: folderIds.map((folderId) => ({ folderId })) },
        },
      });
      return this.toResponse(tx, created.id);
    }, SERIALIZABLE);
  }

  async update(id: string, dto: UpdateIndicatorDto, actor: AuthenticatedUser) {
    return this.prisma.$transaction(async (tx) => {
      const indicator = await this.findOrThrow(tx, id);
      const { projectId } = indicator;
      await this.access.assertCanManageIndicators(actor, projectId, tx);
      await this.access.assertNotArchived(projectId, tx);

      IndicatorsService.assertValueWithinTarget(
        dto.currentValue ?? indicator.currentValue,
        dto.targetValue ?? indicator.targetValue,
      );

      const data: Prisma.IndicatorUncheckedUpdateInput = {};
      if (dto.name !== undefined) data.name = dto.name;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.targetValue !== undefined) data.targetValue = dto.targetValue;
      if (dto.currentValue !== undefined) data.currentValue = dto.currentValue;

      if (
        dto.scope !== undefined ||
        dto.stageId !== undefined ||
        dto.taskId !== undefined
      ) {
        const scope = dto.scope ?? (indicator.scope as IndicatorScope);
        Object.assign(
          data,
          { scope },
          await this.resolveAssignment(
            tx,
            projectId,
            scope,
            dto.stageId !== undefined ? dto.stageId : indicator.stageId,
            dto.taskId !== undefined ? dto.taskId : indicator.taskId,
          ),
        );
      }

      if (dto.ownerId !== undefined) {
        await this.assertOwnerIsMember(tx, projectId, dto.ownerId);
        data.ownerId = dto.ownerId;
      }

      if (dto.folderIds !== undefined) {
        const folderIds = await this.assertFoldersInProject(
          tx,
          projectId,
          dto.folderIds,
        );
        await tx.indicatorFolder.deleteMany({ where: { indicatorId: id } });
        if (folderIds.length > 0) {
          await tx.indicatorFolder.createMany({
            data: folderIds.map((folderId) => ({ indicatorId: id, folderId })),
          });
        }
      }

      await tx.indicator.update({ where: { id }, data });
      return this.toResponse(tx, id);
    }, SERIALIZABLE);
  }

  async updateProgress(
    id: string,
    dto: IndicatorProgressDto,
    actor: AuthenticatedUser,
  ) {
    if ((dto.delta === undefined) === (dto.value === undefined)) {
      throw new BadRequestException(
        'Podaj albo zmianę postępu (delta), albo nową wartość (value)',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const indicator = await this.findOrThrow(tx, id);
      await this.access.assertCanManageIndicators(
        actor,
        indicator.projectId,
        tx,
      );
      await this.access.assertNotArchived(indicator.projectId, tx);

      const requested =
        dto.delta !== undefined
          ? indicator.currentValue + dto.delta
          : dto.value!;
      const currentValue = Math.min(
        indicator.targetValue,
        Math.max(0, requested),
      );

      await tx.indicator.update({ where: { id }, data: { currentValue } });
      return this.toResponse(tx, id);
    }, SERIALIZABLE);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const indicator = await this.findOrThrow(tx, id);
      await this.access.assertCanManageIndicators(
        actor,
        indicator.projectId,
        tx,
      );
      await this.access.assertNotArchived(indicator.projectId, tx);

      await tx.indicatorFolder.deleteMany({ where: { indicatorId: id } });
      await tx.indicator.delete({ where: { id } });
    }, SERIALIZABLE);
  }
}
