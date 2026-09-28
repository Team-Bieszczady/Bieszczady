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
  let findManyCalls = 0;

  return {
    folders,
    documents,
    accesses,
    countFindManyCalls: () => findManyCalls,
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
          accesses.find(
            (row) =>
              row.userId === where.userId &&
              row.folderId === (where.folderId ?? null) &&
              row.documentId === (where.documentId ?? null),
          ) ?? null,
        ),
      findMany: ({ where }: { where: Where }) => {
        findManyCalls++;
        const wanted = (where.documentId as { in: string[] }).in;
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

  const grantFolder = (folderId: string, level: string) =>
    prisma.accesses.push({ folderId, documentId: null, userId: USER, level });

  const grantDocument = (documentId: string, level: string) =>
    prisma.accesses.push({ folderId: null, documentId, userId: USER, level });

  beforeEach(() => {
    prisma = createFakePrisma();
    canManage = false;

    prisma.folders.push({ id: FOLDER, parentId: null });
    prisma.documents.push({ id: 'doc-1', folderId: FOLDER });
    prisma.documents.push({ id: 'doc-2', folderId: FOLDER });

    const fakeAccess = {
      canManageTasks: () => Promise.resolve(canManage),
    };

    service = new DocumentAccessService(
      prisma as unknown as PrismaService,
      fakeAccess as unknown as ProjectAccessService,
    );
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
