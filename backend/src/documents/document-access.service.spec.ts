import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { DocumentAccessService } from './document-access.service';
import { type AuthenticatedUser } from '../auth/types/auth.types';

interface FolderRow {
  id: string;
  parentId: string | null;
}

interface DocumentRow {
  id: string;
  folderId: string;
}

interface AccessRow {
  id?: string;
  projectId?: string;
  folderId: string | null;
  documentId: string | null;
  userId: string;
  level: string;
}

type Where = Record<string, unknown>;

function createFakePrisma() {
  const folders: FolderRow[] = [];
  const documents: DocumentRow[] = [];
  const accesses: AccessRow[] = [];
  const members: {
    projectId: string;
    userId: string;
    projectRole?: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
      isDirector: boolean;
    };
  }[] = [];
  let findManyCalls = 0;
  let nextId = 1;

  return {
    folders,
    documents,
    accesses,
    members,
    countFindManyCalls: () => findManyCalls,
    projectMember: {
      findFirst: ({ where }: { where: Where }) =>
        Promise.resolve(
          members.find(
            (row) =>
              row.projectId === where.projectId && row.userId === where.userId,
          ) ?? null,
        ),
      findMany: ({ where }: { where: Where }) =>
        Promise.resolve(
          members.filter((row) => row.projectId === where.projectId),
        ),
    },
    folder: {
      findFirst: ({ where }: { where: Where }) =>
        Promise.resolve(folders.find((row) => row.id === where.id) ?? null),
    },
    document: {
      findFirst: ({ where }: { where: Where }) =>
        Promise.resolve(documents.find((row) => row.id === where.id) ?? null),
    },
    documentAccess: {
      findFirst: ({ where }: { where: Where }) =>
        Promise.resolve(
          accesses.find((row) =>
            where.id !== undefined
              ? row.id === where.id
              : row.userId === where.userId &&
                row.folderId === (where.folderId ?? null) &&
                row.documentId === (where.documentId ?? null),
          ) ?? null,
        ),
      create: ({ data }: { data: AccessRow }) => {
        const row = { ...data, id: 'access-' + nextId++ };
        accesses.push(row);
        return Promise.resolve(row);
      },
      update: ({ where, data }: { where: Where; data: Partial<AccessRow> }) => {
        const row = accesses.find((item) => item.id === where.id);
        if (!row) {
          return Promise.reject(new Error('Record to update not found'));
        }
        Object.assign(row, data);
        return Promise.resolve(row);
      },
      delete: ({ where }: { where: Where }) => {
        const index = accesses.findIndex((item) => item.id === where.id);
        const [row] = accesses.splice(index, 1);
        return Promise.resolve(row);
      },
      findMany: ({ where }: { where: Where }) => {
        findManyCalls++;
        const byDocuments = where.documentId as { in: string[] } | null;
        if (!byDocuments || !Array.isArray(byDocuments.in)) {
          return Promise.resolve(
            accesses.filter(
              (row) =>
                row.folderId === (where.folderId ?? null) &&
                row.documentId === (where.documentId ?? null),
            ),
          );
        }
        const wanted = byDocuments.in;
        return Promise.resolve(
          accesses.filter(
            (row) =>
              row.userId === where.userId &&
              row.documentId !== null &&
              wanted.includes(row.documentId),
          ),
        );
      },
    },
  };
}

describe('DocumentAccessService', () => {
  const PROJECT = 'project-1';
  const FOLDER = 'folder-1';
  const USER = 'user-1';
  const ACTOR = { id: USER, isDirector: false } as AuthenticatedUser;

  let prisma: ReturnType<typeof createFakePrisma>;
  let service: DocumentAccessService;
  let canManage: boolean;
  let archived: boolean;

  const grantFolder = (folderId: string, level: string) =>
    prisma.accesses.push({ folderId, documentId: null, userId: USER, level });

  const grantDocument = (documentId: string, level: string) =>
    prisma.accesses.push({ folderId: null, documentId, userId: USER, level });

  beforeEach(() => {
    prisma = createFakePrisma();
    canManage = false;
    archived = false;

    prisma.folders.push({ id: FOLDER, parentId: null });
    prisma.documents.push({ id: 'doc-1', folderId: FOLDER });
    prisma.documents.push({ id: 'doc-2', folderId: FOLDER });

    const fakeAccess = {
      canManageTasks: () => Promise.resolve(canManage),
      assertNotArchived: () =>
        archived
          ? Promise.reject(
              new ForbiddenException('Projekt jest zarchiwizowany'),
            )
          : Promise.resolve(),
    };

    service = new DocumentAccessService(
      prisma as unknown as PrismaService,
      fakeAccess as unknown as ProjectAccessService,
    );
  });

  describe('grant', () => {
    const DTO = { userId: USER, level: 'VIEW' as const, folderId: FOLDER };

    beforeEach(() => {
      canManage = true;
      prisma.members.push({ projectId: PROJECT, userId: USER });
    });

    it('refuses for someone who does not manage the project', async () => {
      canManage = false;

      await expect(service.grant(ACTOR, PROJECT, DTO)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('refuses in an archived project', async () => {
      archived = true;

      await expect(service.grant(ACTOR, PROJECT, DTO)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('refuses when neither a folder nor a document is given', async () => {
      await expect(
        service.grant(ACTOR, PROJECT, { userId: USER, level: 'VIEW' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses when both a folder and a document are given', async () => {
      await expect(
        service.grant(ACTOR, PROJECT, {
          userId: USER,
          level: 'VIEW',
          folderId: FOLDER,
          documentId: 'doc-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses for someone outside the project', async () => {
      prisma.members.length = 0;

      await expect(service.grant(ACTOR, PROJECT, DTO)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('changes the level instead of adding a second row', async () => {
      await service.grant(ACTOR, PROJECT, DTO);
      await service.grant(ACTOR, PROJECT, { ...DTO, level: 'EDIT' });

      expect(prisma.accesses).toHaveLength(1);
      expect(prisma.accesses[0].level).toBe('EDIT');
    });
  });

  describe('revoke', () => {
    beforeEach(() => {
      canManage = true;
      prisma.accesses.push({
        id: 'access-9',
        projectId: PROJECT,
        folderId: FOLDER,
        documentId: null,
        userId: USER,
        level: 'VIEW',
      });
    });

    it('refuses for someone who does not manage the project', async () => {
      canManage = false;

      await expect(service.revoke(ACTOR, PROJECT, 'access-9')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('refuses in an archived project', async () => {
      archived = true;

      await expect(service.revoke(ACTOR, PROJECT, 'access-9')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('removes the row', async () => {
      await service.revoke(ACTOR, PROJECT, 'access-9');

      expect(prisma.accesses).toHaveLength(0);
    });
  });

  describe('listFor', () => {
    it('refuses for someone who does not manage the project', async () => {
      await expect(
        service.listFor(ACTOR, PROJECT, { folderId: FOLDER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('marks coordinators and directors as always having access', async () => {
      canManage = true;
      const person = (
        userId: string,
        projectRole: string,
        isDirector: boolean,
      ) =>
        prisma.members.push({
          projectId: PROJECT,
          userId,
          projectRole,
          user: {
            firstName: userId,
            lastName: '',
            email: userId + '@example.com',
            isDirector,
          },
        });
      person('koordynator', 'COORDINATOR', false);
      person('dyrektor', 'EXECUTOR', true);
      person(USER, 'EXECUTOR', false);

      const rows = await service.listFor(ACTOR, PROJECT, { folderId: FOLDER });
      const isManager = (userId: string) =>
        rows.find((row) => row.userId === userId)?.isManager;

      expect(isManager('koordynator')).toBe(true);
      expect(isManager('dyrektor')).toBe(true);
      expect(isManager(USER)).toBe(false);
    });
  });

  describe('folderLevelFor', () => {
    it('returns the level granted on the folder itself', async () => {
      grantFolder(FOLDER, 'VIEW');

      await expect(service.folderLevelFor(FOLDER, USER)).resolves.toBe('VIEW');
    });

    it('takes the level from the nearest granted ancestor', async () => {
      prisma.folders.push({ id: 'child', parentId: FOLDER });
      prisma.folders.push({ id: 'grandchild', parentId: 'child' });
      grantFolder(FOLDER, 'EDIT');

      await expect(service.folderLevelFor('grandchild', USER)).resolves.toBe(
        'EDIT',
      );
    });

    it('lets a closer grant win over the one further up', async () => {
      prisma.folders.push({ id: 'child', parentId: FOLDER });
      grantFolder(FOLDER, 'EDIT');
      grantFolder('child', 'VIEW');

      await expect(service.folderLevelFor('child', USER)).resolves.toBe('VIEW');
    });

    it('returns nothing when no ancestor was granted', async () => {
      await expect(service.folderLevelFor(FOLDER, USER)).resolves.toBeNull();
    });
  });

  describe('documentLevelFor', () => {
    it('prefers a grant on the document over the one on its folder', async () => {
      grantFolder(FOLDER, 'EDIT');
      grantDocument('doc-1', 'VIEW');

      await expect(service.documentLevelFor('doc-1', USER)).resolves.toBe(
        'VIEW',
      );
    });

    it('falls back to the folder when the document has no grant', async () => {
      grantFolder(FOLDER, 'EDIT');

      await expect(service.documentLevelFor('doc-1', USER)).resolves.toBe(
        'EDIT',
      );
    });
  });

  describe('levelsForDocuments', () => {
    it('gives someone who manages the project edit rights everywhere', async () => {
      canManage = true;

      const levels = await service.levelsForDocuments(ACTOR, PROJECT, FOLDER, [
        'doc-1',
        'doc-2',
      ]);

      expect(levels.get('doc-1')).toBe('EDIT');
      expect(levels.get('doc-2')).toBe('EDIT');
      expect(prisma.countFindManyCalls()).toBe(0);
    });

    it('lets a grant on one document override the folder level', async () => {
      grantFolder(FOLDER, 'EDIT');
      grantDocument('doc-2', 'VIEW');

      const levels = await service.levelsForDocuments(ACTOR, PROJECT, FOLDER, [
        'doc-1',
        'doc-2',
      ]);

      expect(levels.get('doc-1')).toBe('EDIT');
      expect(levels.get('doc-2')).toBe('VIEW');
    });

    it('returns nothing for a folder nobody granted', async () => {
      const levels = await service.levelsForDocuments(ACTOR, PROJECT, FOLDER, [
        'doc-1',
      ]);

      expect(levels.get('doc-1')).toBeNull();
    });

    it('agrees with documentLevelFor for the same documents', async () => {
      prisma.folders.push({ id: 'child', parentId: FOLDER });
      prisma.documents.push({ id: 'doc-3', folderId: 'child' });
      grantFolder(FOLDER, 'EDIT');
      grantDocument('doc-2', 'VIEW');

      const levels = await service.levelsForDocuments(ACTOR, PROJECT, FOLDER, [
        'doc-1',
        'doc-2',
      ]);

      for (const id of ['doc-1', 'doc-2']) {
        expect(levels.get(id)).toBe(await service.documentLevelFor(id, USER));
      }
    });

    it('asks the database once, not once per document', async () => {
      grantFolder(FOLDER, 'EDIT');

      await service.levelsForDocuments(ACTOR, PROJECT, FOLDER, [
        'doc-1',
        'doc-2',
      ]);

      expect(prisma.countFindManyCalls()).toBe(1);
    });
  });
});
