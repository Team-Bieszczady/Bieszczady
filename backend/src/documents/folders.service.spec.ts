import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FoldersService } from './folders.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { type AuthenticatedUser } from '../auth/types/auth.types';

interface FolderRow {
  [key: string]: unknown;
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  ownerId: string;
  deletedAt: Date | null;
}

interface DocumentRow {
  [key: string]: unknown;
  id: string;
  folderId: string;
  deletedAt: Date | null;
}

type Where = Record<string, unknown>;

function matches(row: Record<string, unknown>, where: Where): boolean {
  return Object.entries(where).every(([key, value]) => row[key] === value);
}

/**
 * Stands in for the folders and documents tables. Only the operations the
 * service actually performs are implemented; anything else would be untested.
 */
function createFakePrisma() {
  const folders: FolderRow[] = [];
  const documents: DocumentRow[] = [];
  let nextId = 1;

  return {
    folders,
    documents,
    folder: {
      findMany: ({
        where,
        orderBy,
      }: {
        where: Where;
        orderBy?: { name: 'asc' | 'desc' };
      }) => {
        const found = folders.filter((row) => matches(row, where));
        if (orderBy?.name === 'asc') {
          found.sort((a, b) => a.name.localeCompare(b.name));
        }
        return Promise.resolve(found);
      },
      findFirst: ({ where }: { where: Where }) =>
        Promise.resolve(folders.find((row) => matches(row, where)) ?? null),
      create: ({
        data,
      }: {
        data: {
          name: string;
          parentId?: string;
          projectId: string;
          ownerId: string;
        };
      }) => {
        const row: FolderRow = {
          ...data,
          id: `folder-${nextId++}`,
          parentId: data.parentId ?? null,
          deletedAt: null,
        };
        folders.push(row);
        return Promise.resolve(row);
      },
      update: ({ where, data }: { where: Where; data: Partial<FolderRow> }) => {
        const row = folders.find((item) => matches(item, where));
        if (!row) {
          return Promise.reject(new Error('Record to update not found'));
        }
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined) {
            row[key] = value;
          }
        }
        return Promise.resolve(row);
      },
    },
    document: {
      findFirst: ({ where }: { where: Where }) =>
        Promise.resolve(documents.find((row) => matches(row, where)) ?? null),
    },
  };
}

describe('FoldersService', () => {
  const PROJECT = 'project-1';
  const OTHER_PROJECT = 'project-2';
  const OWNER = 'user-1';
  const ACTOR = { id: OWNER, isDirector: true } as AuthenticatedUser;

  // These tests cover folder rules, not permissions, so access always passes.
  const fakeAccess = {
    assertCanRead: () => Promise.resolve(),
    assertNotArchived: () => Promise.resolve(),
  };

  let prisma: ReturnType<typeof createFakePrisma>;
  let service: FoldersService;

  const addFolder = (row: Partial<FolderRow> & { id: string }): FolderRow => {
    const full: FolderRow = {
      projectId: PROJECT,
      parentId: null,
      name: row.id,
      ownerId: OWNER,
      deletedAt: null,
      ...row,
    };
    prisma.folders.push(full);
    return full;
  };

  beforeEach(() => {
    prisma = createFakePrisma();
    service = new FoldersService(
      prisma as unknown as PrismaService,
      fakeAccess as unknown as ProjectAccessService,
    );
  });

  describe('findAllForProject', () => {
    it('returns only folders of the given project', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'b', projectId: OTHER_PROJECT });

      const found = await service.findAllForProject(PROJECT, ACTOR);

      expect(found.map((f) => f.id)).toEqual(['a']);
    });

    it('leaves out folders that were deleted', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'b', deletedAt: new Date() });

      const found = await service.findAllForProject(PROJECT, ACTOR);

      expect(found.map((f) => f.id)).toEqual(['a']);
    });

    it('sorts by name', async () => {
      addFolder({ id: 'a', name: 'Robocze' });
      addFolder({ id: 'b', name: 'Archiwum' });

      const found = await service.findAllForProject(PROJECT, ACTOR);

      expect(found.map((f) => f.name)).toEqual(['Archiwum', 'Robocze']);
    });
  });

  describe('createFolder', () => {
    it('creates a top level folder with no parent', async () => {
      const created = await service.createFolder(
        PROJECT,
        OWNER,
        {
          name: 'Robocze',
        },
        ACTOR,
      );

      expect(created.parentId).toBeNull();
      expect(created.projectId).toBe(PROJECT);
      expect(created.ownerId).toBe(OWNER);
    });

    it('creates a folder inside another one', async () => {
      const parent = addFolder({ id: 'parent' });

      const created = await service.createFolder(
        PROJECT,
        OWNER,
        {
          name: 'Oznakowanie',
          parentId: parent.id,
        },
        ACTOR,
      );

      expect(created.parentId).toBe('parent');
    });
  });

  describe('updateFolder', () => {
    it('renames without touching the parent', async () => {
      addFolder({ id: 'a', parentId: 'p', name: 'Stara' });
      addFolder({ id: 'p' });

      const updated = await service.updateFolder(
        'a',
        PROJECT,
        {
          name: 'Nowa',
        },
        ACTOR,
      );

      expect(updated.name).toBe('Nowa');
      expect(updated.parentId).toBe('p');
    });

    it('moves without touching the name', async () => {
      addFolder({ id: 'a', name: 'Robocze' });
      addFolder({ id: 'b' });

      const updated = await service.updateFolder(
        'a',
        PROJECT,
        {
          parentId: 'b',
        },
        ACTOR,
      );

      expect(updated.parentId).toBe('b');
      expect(updated.name).toBe('Robocze');
    });

    it('rejects a parent from another project', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'obcy', projectId: OTHER_PROJECT });

      await expect(
        service.updateFolder('a', PROJECT, { parentId: 'obcy' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a folder from another project', async () => {
      addFolder({ id: 'a', projectId: OTHER_PROJECT });

      await expect(
        service.updateFolder('a', PROJECT, { name: 'Nowa' }, ACTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects moving a folder into itself', async () => {
      addFolder({ id: 'a' });

      await expect(
        service.updateFolder('a', PROJECT, { parentId: 'a' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects moving a folder into its own child', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'b', parentId: 'a' });

      await expect(
        service.updateFolder('a', PROJECT, { parentId: 'b' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects moving a folder into its own grandchild', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'b', parentId: 'a' });
      addFolder({ id: 'c', parentId: 'b' });

      await expect(
        service.updateFolder('a', PROJECT, { parentId: 'c' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows moving a folder into an unrelated branch', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'b', parentId: 'a' });
      addFolder({ id: 'archiwum' });

      const updated = await service.updateFolder(
        'a',
        PROJECT,
        {
          parentId: 'archiwum',
        },
        ACTOR,
      );

      expect(updated.parentId).toBe('archiwum');
    });

    it('gives up instead of looping forever on a corrupted chain', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'x', parentId: 'y' });
      addFolder({ id: 'y', parentId: 'x' });

      await expect(
        service.updateFolder('a', PROJECT, { parentId: 'x' }, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFolder', () => {
    it('marks the folder as deleted instead of removing the row', async () => {
      addFolder({ id: 'a' });

      await service.deleteFolder('a', PROJECT, ACTOR);

      expect(prisma.folders).toHaveLength(1);
      expect(prisma.folders[0].deletedAt).toBeInstanceOf(Date);
    });

    it('refuses when the folder still holds a subfolder', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'b', parentId: 'a' });

      await expect(service.deleteFolder('a', PROJECT, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('refuses when the folder still holds a document', async () => {
      addFolder({ id: 'a' });
      prisma.documents.push({ id: 'doc', folderId: 'a', deletedAt: null });

      await expect(service.deleteFolder('a', PROJECT, ACTOR)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('allows deleting when the contents are already in the trash', async () => {
      addFolder({ id: 'a' });
      addFolder({ id: 'b', parentId: 'a', deletedAt: new Date() });
      prisma.documents.push({
        id: 'doc',
        folderId: 'a',
        deletedAt: new Date(),
      });

      await service.deleteFolder('a', PROJECT, ACTOR);

      expect(prisma.folders[0].deletedAt).toBeInstanceOf(Date);
    });

    it('rejects a folder from another project', async () => {
      addFolder({ id: 'a', projectId: OTHER_PROJECT });

      await expect(service.deleteFolder('a', PROJECT, ACTOR)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
