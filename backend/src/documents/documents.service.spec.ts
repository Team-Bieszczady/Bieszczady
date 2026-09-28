import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { DocumentAccessService } from './document-access.service';
import { DocumentsService } from './documents.service';
import { type AuthenticatedUser } from '../auth/types/auth.types';

interface FolderRow {
  [key: string]: unknown;
  id: string;
  projectId: string;
  name: string;
  deletedAt: Date | null;
}

interface DocumentRow {
  [key: string]: unknown;
  id: string;
  projectId: string;
  folderId: string;
  name: string;
  kind: string;
  status: string;
  ownerId: string;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface VersionRow {
  [key: string]: unknown;
  id: string;
  documentId: string;
  versionNo: number;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  changeNote: string | null;
}

type Where = Record<string, unknown>;

function matchValue(actual: unknown, expected: unknown): boolean {
  if (expected && typeof expected === 'object' && 'not' in expected) {
    return actual !== expected.not;
  }
  return actual === expected;
}

function matchesRow(row: Record<string, unknown>, where: Where): boolean {
  return Object.entries(where).every(([key, value]) =>
    matchValue(row[key], value),
  );
}

function createFakePrisma() {
  const folders: FolderRow[] = [];
  const documents: DocumentRow[] = [];
  const versions: VersionRow[] = [];
  let nextId = 1;

  const matchesVersion = (row: VersionRow, where: Where): boolean =>
    Object.entries(where).every(([key, value]) => {
      if (key !== 'document') {
        return matchValue(row[key], value);
      }
      const parent = documents.find((doc) => doc.id === row.documentId);
      return parent ? matchesRow(parent, value as Where) : false;
    });

  const sortVersions = (rows: VersionRow[], orderBy?: Where) =>
    orderBy && (orderBy as { versionNo?: string }).versionNo === 'desc'
      ? [...rows].sort((a, b) => b.versionNo - a.versionNo)
      : rows;

  return {
    folders,
    documents,
    versions,
    folder: {
      findFirst: ({ where }: { where: Where }) =>
        Promise.resolve(folders.find((row) => matchesRow(row, where)) ?? null),
    },
    document: {
      findFirst: ({
        where,
        include,
      }: {
        where: Where;
        include?: { folder?: unknown; versions?: unknown };
      }) => {
        const row = documents.find((item) => matchesRow(item, where));
        if (!row) {
          return Promise.resolve(null);
        }
        return Promise.resolve({
          ...row,
          ...(include?.folder
            ? { folder: folders.find((item) => item.id === row.folderId) }
            : {}),
          ...(include?.versions
            ? {
                versions: versions.filter((item) => item.documentId === row.id),
              }
            : {}),
        });
      },
      findMany: ({ where }: { where: Where }) =>
        Promise.resolve(documents.filter((row) => matchesRow(row, where))),
      count: ({ where }: { where: Where }) =>
        Promise.resolve(
          documents.filter((row) => matchesRow(row, where)).length,
        ),
      create: ({ data }: { data: Partial<DocumentRow> }) => {
        const row = {
          updatedAt: new Date(2026, 0, 1),
          deletedAt: null,
          ...data,
        } as DocumentRow;
        documents.push(row);
        return Promise.resolve(row);
      },
      update: ({
        where,
        data,
      }: {
        where: Where;
        data: Partial<DocumentRow>;
      }) => {
        const row = documents.find((item) => matchesRow(item, where));
        if (!row) {
          return Promise.reject(new Error('Record to update not found'));
        }
        Object.assign(row, data);
        return Promise.resolve(row);
      },
      delete: ({ where }: { where: Where }) => {
        const index = documents.findIndex((item) => matchesRow(item, where));
        if (index === -1) {
          return Promise.reject(new Error('Record to delete not found'));
        }
        const [row] = documents.splice(index, 1);
        return Promise.resolve(row);
      },
    },
    documentVersion: {
      findFirst: ({ where, orderBy }: { where: Where; orderBy?: Where }) => {
        const found = versions.filter((row) => matchesVersion(row, where));
        return Promise.resolve(sortVersions(found, orderBy)[0] ?? null);
      },
      findMany: ({ where, orderBy }: { where: Where; orderBy?: Where }) => {
        const found = versions.filter((row) => matchesVersion(row, where));
        return Promise.resolve(sortVersions(found, orderBy));
      },
      create: ({ data }: { data: Partial<VersionRow> }) => {
        const row = {
          id: `version-${nextId++}`,
          changeNote: null,
          ...data,
        } as VersionRow;
        versions.push(row);
        return Promise.resolve(row);
      },
      deleteMany: ({ where }: { where: Where }) => {
        const kept = versions.filter((row) => !matchesVersion(row, where));
        const removed = versions.length - kept.length;
        versions.length = 0;
        versions.push(...kept);
        return Promise.resolve({ count: removed });
      },
    },
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  };
}

function createFakeStorage() {
  const saved = new Map<string, Buffer>();
  const removed: string[] = [];

  return {
    saved,
    removed,
    save: (key: string, buffer: Buffer) => {
      saved.set(key, buffer);
      return Promise.resolve();
    },
    read: (key: string) => Promise.resolve(saved.get(key) ?? Buffer.from('')),
    remove: (key: string) => {
      removed.push(key);
      return Promise.resolve();
    },
  };
}

describe('DocumentsService', () => {
  const PROJECT = 'project-1';
  const FOLDER = 'folder-1';
  const OWNER = 'user-1';
  const ACTOR = { id: OWNER, isDirector: false } as AuthenticatedUser;
  const DIRECTOR = { id: 'director-1', isDirector: true } as AuthenticatedUser;

  const FILE = {
    buffer: Buffer.from('tresc'),
    originalname: 'umowa.pdf',
    mimetype: 'application/pdf',
    size: 5,
  };

  let prisma: ReturnType<typeof createFakePrisma>;
  let storage: ReturnType<typeof createFakeStorage>;
  let service: DocumentsService;

  // Set per test to steer the two permission services.
  let canManage: boolean;
  let archived: boolean;
  let level: 'VIEW' | 'EDIT' | null;
  // Left undefined, folders answer with `level` like everything else.
  let folderLevel: 'VIEW' | 'EDIT' | null | undefined;

  const addFolder = (row: Partial<FolderRow> & { id: string }): FolderRow => {
    const full: FolderRow = {
      projectId: PROJECT,
      name: row.id,
      deletedAt: null,
      ...row,
    };
    prisma.folders.push(full);
    return full;
  };

  const addDocument = (
    row: Partial<DocumentRow> & { id: string },
  ): DocumentRow => {
    const full: DocumentRow = {
      projectId: PROJECT,
      folderId: FOLDER,
      name: row.id,
      kind: 'CONTRACT',
      status: 'APPROVED',
      ownerId: OWNER,
      updatedAt: new Date(2026, 0, 1),
      deletedAt: null,
      ...row,
    };
    prisma.documents.push(full);
    return full;
  };

  const addVersion = (
    row: Partial<VersionRow> & { id: string; documentId: string },
  ): VersionRow => {
    const full: VersionRow = {
      versionNo: 1,
      storageKey: `${PROJECT}/${row.documentId}/v1`,
      fileName: 'umowa.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 5,
      uploadedById: OWNER,
      changeNote: null,
      ...row,
    };
    prisma.versions.push(full);
    return full;
  };

  beforeEach(() => {
    prisma = createFakePrisma();
    storage = createFakeStorage();
    canManage = true;
    archived = false;
    level = 'EDIT';
    folderLevel = undefined;

    const fakeAccess = {
      assertCanRead: () => Promise.resolve(),
      assertNotArchived: () =>
        archived
          ? Promise.reject(
              new ForbiddenException('Projekt jest zarchiwizowany'),
            )
          : Promise.resolve(),
      canManageTasks: () => Promise.resolve(canManage),
    };

    const fakeDocumentAccess = {
      levelFor: (
        _actor: AuthenticatedUser,
        _projectId: string,
        target: { folderId?: string; documentId?: string },
      ) =>
        Promise.resolve(
          target.folderId && folderLevel !== undefined ? folderLevel : level,
        ),
      levelsForDocuments: (
        _actor: AuthenticatedUser,
        _projectId: string,
        _folderId: string,
        documentIds: string[],
      ) => Promise.resolve(new Map(documentIds.map((id) => [id, level]))),
    };

    service = new DocumentsService(
      prisma as unknown as PrismaService,
      storage as unknown as StorageService,
      fakeAccess as unknown as ProjectAccessService,
      fakeDocumentAccess as unknown as DocumentAccessService,
    );

    addFolder({ id: FOLDER });
  });

  describe('createDocument', () => {
    it('approves straight away when the uploader manages the project', async () => {
      const created = await service.createDocument(
        PROJECT,
        FOLDER,
        OWNER,
        { name: 'Umowa', kind: 'CONTRACT' },
        FILE,
        ACTOR,
      );

      expect(created.status).toBe('APPROVED');
      expect(created.versions[0].versionNo).toBe(1);
      expect(storage.saved.size).toBe(1);
    });

    it('waits for approval when the uploader does not manage the project', async () => {
      canManage = false;

      const created = await service.createDocument(
        PROJECT,
        FOLDER,
        OWNER,
        { name: 'Umowa', kind: 'CONTRACT' },
        FILE,
        ACTOR,
      );

      expect(created.status).toBe('PENDING_APPROVAL');
    });

    it('refuses when the uploader only has view access to the folder', async () => {
      level = 'VIEW';

      await expect(
        service.createDocument(
          PROJECT,
          FOLDER,
          OWNER,
          { name: 'Umowa', kind: 'CONTRACT' },
          FILE,
          ACTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses when the folder is from another project', async () => {
      await expect(
        service.createDocument(
          PROJECT,
          'obcy-folder',
          OWNER,
          { name: 'Umowa', kind: 'CONTRACT' },
          FILE,
          ACTOR,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('saves as signed when someone who manages asks for it', async () => {
      const created = await service.createDocument(
        PROJECT,
        FOLDER,
        OWNER,
        { name: 'Umowa', kind: 'CONTRACT', asSigned: 'true' },
        FILE,
        ACTOR,
      );

      expect(created.status).toBe('SIGNED');
    });

    it('refuses to save as signed when the uploader cannot approve', async () => {
      canManage = false;

      await expect(
        service.createDocument(
          PROJECT,
          FOLDER,
          OWNER,
          { name: 'Umowa', kind: 'CONTRACT', asSigned: 'true' },
          FILE,
          ACTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('keeps a draft a draft even when signed is asked for too', async () => {
      const created = await service.createDocument(
        PROJECT,
        FOLDER,
        OWNER,
        { name: 'Umowa', kind: 'CONTRACT', asDraft: 'true', asSigned: 'true' },
        FILE,
        ACTOR,
      );

      expect(created.status).toBe('DRAFT');
    });

    it('refuses to upload into an archived project', async () => {
      archived = true;

      await expect(
        service.createDocument(
          PROJECT,
          FOLDER,
          OWNER,
          { name: 'Umowa', kind: 'CONTRACT' },
          FILE,
          ACTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('saves as a draft when the uploader asks for it', async () => {
      const created = await service.createDocument(
        PROJECT,
        FOLDER,
        OWNER,
        { name: 'Umowa', kind: 'CONTRACT', asDraft: 'true' },
        FILE,
        ACTOR,
      );

      expect(created.status).toBe('DRAFT');
    });
  });

  describe('createVersion', () => {
    it('numbers the new version after the latest one', async () => {
      addDocument({ id: 'doc-1' });
      addVersion({ id: 'v1', documentId: 'doc-1', versionNo: 1 });
      addVersion({ id: 'v2', documentId: 'doc-1', versionNo: 2 });

      const created = await service.createVersion(
        'doc-1',
        PROJECT,
        OWNER,
        {},
        FILE,
        ACTOR,
      );

      expect(created.versionNo).toBe(3);
    });

    it('refuses with view access only', async () => {
      level = 'VIEW';
      addDocument({ id: 'doc-1' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await expect(
        service.createVersion('doc-1', PROJECT, OWNER, {}, FILE, ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses for a document that has no versions', async () => {
      await expect(
        service.createVersion('doc-x', PROJECT, OWNER, {}, FILE, ACTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('sends an approved document back for approval', async () => {
      addDocument({ id: 'doc-1', status: 'APPROVED' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await service.createVersion('doc-1', PROJECT, OWNER, {}, FILE, ACTOR);

      expect(prisma.documents[0].status).toBe('PENDING_APPROVAL');
    });

    it('leaves a draft as a draft', async () => {
      addDocument({ id: 'doc-1', status: 'DRAFT' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await service.createVersion('doc-1', PROJECT, OWNER, {}, FILE, ACTOR);

      expect(prisma.documents[0].status).toBe('DRAFT');
    });

    it('marks the document as signed when the scan is uploaded', async () => {
      addDocument({ id: 'doc-1', status: 'APPROVED' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await service.createVersion(
        'doc-1',
        PROJECT,
        OWNER,
        { markSigned: 'true' },
        FILE,
        ACTOR,
      );

      expect(prisma.documents[0].status).toBe('SIGNED');
    });

    it('refuses to sign for someone who cannot approve', async () => {
      canManage = false;
      addDocument({ id: 'doc-1', status: 'APPROVED' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await expect(
        service.createVersion(
          'doc-1',
          PROJECT,
          OWNER,
          { markSigned: 'true' },
          FILE,
          ACTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('sends a signed document back for approval', async () => {
      addDocument({ id: 'doc-1', status: 'SIGNED' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await service.createVersion('doc-1', PROJECT, OWNER, {}, FILE, ACTOR);

      expect(prisma.documents[0].status).toBe('PENDING_APPROVAL');
    });

    it('refuses to sign a document that is not approved', async () => {
      addDocument({ id: 'doc-1', status: 'DRAFT' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await expect(
        service.createVersion(
          'doc-1',
          PROJECT,
          OWNER,
          { markSigned: 'true' },
          FILE,
          ACTOR,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('submitForApproval', () => {
    it('sends a draft for approval', async () => {
      canManage = false;
      addDocument({ id: 'doc-1', status: 'DRAFT' });

      const sent = await service.submitForApproval(PROJECT, 'doc-1', ACTOR);

      expect(sent.status).toBe('PENDING_APPROVAL');
    });

    it('approves the draft straight away for someone who manages', async () => {
      addDocument({ id: 'doc-1', status: 'DRAFT' });

      const sent = await service.submitForApproval(PROJECT, 'doc-1', ACTOR);

      expect(sent.status).toBe('APPROVED');
    });

    it('refuses a document that is not a draft', async () => {
      addDocument({ id: 'doc-1', status: 'APPROVED' });

      await expect(
        service.submitForApproval(PROJECT, 'doc-1', ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses with view access only', async () => {
      level = 'VIEW';
      addDocument({ id: 'doc-1', status: 'DRAFT' });

      await expect(
        service.submitForApproval(PROJECT, 'doc-1', ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDocuments', () => {
    it('returns only live documents of that folder', async () => {
      addDocument({ id: 'doc-1' });
      addDocument({ id: 'doc-2', deletedAt: new Date() });
      addDocument({ id: 'doc-3', folderId: 'inny-folder' });

      const found = await service.getDocuments(PROJECT, FOLDER, ACTOR);

      expect(found.map((d) => d.id)).toEqual(['doc-1']);
    });

    it('tells the caller what they may do with each document', async () => {
      level = 'VIEW';
      addDocument({ id: 'doc-1' });

      const found = await service.getDocuments(PROJECT, FOLDER, ACTOR);

      expect(found[0].accessLevel).toBe('VIEW');
    });

    it('refuses when the folder is not shared with the caller', async () => {
      level = null;

      await expect(
        service.getDocuments(PROJECT, FOLDER, ACTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('downloadDocument', () => {
    it('returns the file of the requested version', async () => {
      addDocument({ id: 'doc-1' });
      addVersion({
        id: 'v1',
        documentId: 'doc-1',
        storageKey: 'klucz',
        fileName: 'plik.pdf',
      });
      storage.saved.set('klucz', Buffer.from('abc'));

      const result = await service.downloadDocument(PROJECT, 'doc-1', 1, ACTOR);

      expect(result.fileName).toBe('plik.pdf');
      expect(result.buffer.toString()).toBe('abc');
    });

    it('allows view access', async () => {
      level = 'VIEW';
      addDocument({ id: 'doc-1' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await expect(
        service.downloadDocument(PROJECT, 'doc-1', 1, ACTOR),
      ).resolves.toBeDefined();
    });

    it('hides the document when nothing is shared', async () => {
      level = null;
      addDocument({ id: 'doc-1' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await expect(
        service.downloadDocument(PROJECT, 'doc-1', 1, ACTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreDocument', () => {
    it('puts the document back when its folder is still there', async () => {
      addDocument({ id: 'doc-1', deletedAt: new Date() });

      const restored = await service.restoreDocument(
        PROJECT,
        'doc-1',
        {},
        ACTOR,
      );

      expect(restored.deletedAt).toBeNull();
    });

    it('moves the document to the folder that was picked', async () => {
      addFolder({ id: 'folder-2' });
      addDocument({ id: 'doc-1', deletedAt: new Date() });

      const restored = await service.restoreDocument(
        PROJECT,
        'doc-1',
        { folderId: 'folder-2' },
        ACTOR,
      );

      expect(restored.folderId).toBe('folder-2');
      expect(restored.deletedAt).toBeNull();
    });

    it('asks for a folder when the original one is gone', async () => {
      addFolder({ id: 'folder-usuniety', deletedAt: new Date() });
      addDocument({
        id: 'doc-1',
        folderId: 'folder-usuniety',
        deletedAt: new Date(),
      });

      await expect(
        service.restoreDocument(PROJECT, 'doc-1', {}, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses for a document that is not in the trash', async () => {
      addDocument({ id: 'doc-1' });

      await expect(
        service.restoreDocument(PROJECT, 'doc-1', {}, ACTOR),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses with view access only', async () => {
      level = 'VIEW';
      addDocument({ id: 'doc-1', deletedAt: new Date() });

      await expect(
        service.restoreDocument(PROJECT, 'doc-1', {}, ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses to restore into a folder the caller may only view', async () => {
      folderLevel = 'VIEW';
      addFolder({ id: 'folder-2' });
      addDocument({ id: 'doc-1', deletedAt: new Date() });

      await expect(
        service.restoreDocument(
          PROJECT,
          'doc-1',
          { folderId: 'folder-2' },
          ACTOR,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getVersions', () => {
    it('returns the newest version first', async () => {
      addDocument({ id: 'doc-1' });
      addVersion({ id: 'v1', documentId: 'doc-1', versionNo: 1 });
      addVersion({ id: 'v2', documentId: 'doc-1', versionNo: 2 });

      const found = await service.getVersions(PROJECT, 'doc-1', ACTOR);

      expect(found.map((v) => v.versionNo)).toEqual([2, 1]);
    });

    it('refuses for a document without versions', async () => {
      await expect(
        service.getVersions(PROJECT, 'doc-x', ACTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('restoreVersion', () => {
    it('adds the old content back as a new version', async () => {
      addDocument({ id: 'doc-1' });
      addVersion({
        id: 'v1',
        documentId: 'doc-1',
        versionNo: 1,
        storageKey: 'stary',
      });
      addVersion({
        id: 'v2',
        documentId: 'doc-1',
        versionNo: 2,
        storageKey: 'nowy',
      });

      const created = await service.restoreVersion(
        PROJECT,
        'doc-1',
        1,
        OWNER,
        ACTOR,
      );

      expect(created.versionNo).toBe(3);
      expect(created.storageKey).toBe('stary');
      expect(created.changeNote).toBe('Przywrócono wersję v1');
    });

    it('sends a signed document back for approval', async () => {
      addDocument({ id: 'doc-1', status: 'SIGNED' });
      addVersion({
        id: 'v1',
        documentId: 'doc-1',
        versionNo: 1,
        storageKey: 'stary',
      });
      addVersion({
        id: 'v2',
        documentId: 'doc-1',
        versionNo: 2,
        storageKey: 'nowy',
      });

      await service.restoreVersion(PROJECT, 'doc-1', 1, OWNER, ACTOR);

      expect(prisma.documents[0].status).toBe('PENDING_APPROVAL');
    });

    it('refuses when the latest version already holds that content', async () => {
      addDocument({ id: 'doc-1' });
      addVersion({
        id: 'v1',
        documentId: 'doc-1',
        versionNo: 1,
        storageKey: 'ten-sam',
      });

      await expect(
        service.restoreVersion(PROJECT, 'doc-1', 1, OWNER, ACTOR),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses with view access only', async () => {
      level = 'VIEW';
      addDocument({ id: 'doc-1' });
      addVersion({ id: 'v1', documentId: 'doc-1' });

      await expect(
        service.restoreVersion(PROJECT, 'doc-1', 1, OWNER, ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteDocument', () => {
    it('moves a pending document to the trash', async () => {
      addDocument({ id: 'doc-1', status: 'PENDING_APPROVAL' });

      const deleted = await service.deleteDocument(PROJECT, 'doc-1', ACTOR);

      expect(deleted.deletedAt).toBeInstanceOf(Date);
    });

    it('refuses to delete an approved document unless the caller is a director', async () => {
      addDocument({ id: 'doc-1', status: 'APPROVED' });

      await expect(
        service.deleteDocument(PROJECT, 'doc-1', ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets a director delete an approved document', async () => {
      addDocument({ id: 'doc-1', status: 'APPROVED' });

      const deleted = await service.deleteDocument(PROJECT, 'doc-1', DIRECTOR);

      expect(deleted.deletedAt).toBeInstanceOf(Date);
    });

    it('refuses to delete a signed document unless the caller is a director', async () => {
      addDocument({ id: 'doc-1', status: 'SIGNED' });

      await expect(
        service.deleteDocument(PROJECT, 'doc-1', ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateDocument', () => {
    it('renames the document', async () => {
      addDocument({ id: 'doc-1', name: 'Stara' });

      const updated = await service.updateDocument(
        PROJECT,
        'doc-1',
        { name: 'Nowa' },
        ACTOR,
      );

      expect(updated.name).toBe('Nowa');
    });

    it('refuses with view access only', async () => {
      level = 'VIEW';
      addDocument({ id: 'doc-1' });

      await expect(
        service.updateDocument(PROJECT, 'doc-1', { name: 'Nowa' }, ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approveDocument', () => {
    it('approves a waiting document', async () => {
      addDocument({ id: 'doc-1', status: 'PENDING_APPROVAL' });

      const approved = await service.approveDocument(PROJECT, 'doc-1', ACTOR);

      expect(approved.status).toBe('APPROVED');
    });

    it('refuses when the caller does not manage the project', async () => {
      canManage = false;
      addDocument({ id: 'doc-1', status: 'PENDING_APPROVAL' });

      await expect(
        service.approveDocument(PROJECT, 'doc-1', ACTOR),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses for a document that is not waiting', async () => {
      addDocument({ id: 'doc-1', status: 'APPROVED' });

      await expect(
        service.approveDocument(PROJECT, 'doc-1', ACTOR),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTrash', () => {
    it('shows the whole trash to someone who manages the project', async () => {
      addDocument({ id: 'doc-1', deletedAt: new Date() });
      addDocument({ id: 'doc-2', deletedAt: new Date() });

      const found = await service.getTrash(PROJECT, ACTOR);

      expect(found).toHaveLength(2);
    });

    it('hides documents the caller has no access to', async () => {
      canManage = false;
      level = null;
      addDocument({ id: 'doc-1', deletedAt: new Date() });

      const found = await service.getTrash(PROJECT, ACTOR);

      expect(found).toHaveLength(0);
    });
  });

  describe('deleteDocumentPermanently', () => {
    it('removes the rows first and the files afterwards', async () => {
      addDocument({ id: 'doc-1', deletedAt: new Date() });
      addVersion({ id: 'v1', documentId: 'doc-1', storageKey: 'klucz-1' });

      await service.deleteDocumentPermanently(PROJECT, 'doc-1', ACTOR);

      expect(prisma.documents).toHaveLength(0);
      expect(prisma.versions).toHaveLength(0);
      expect(storage.removed).toEqual(['klucz-1']);
    });

    it('refuses for a document that is not in the trash', async () => {
      addDocument({ id: 'doc-1' });

      await expect(
        service.deleteDocumentPermanently(PROJECT, 'doc-1', ACTOR),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('countPendingApproval', () => {
    it('counts documents waiting for approval', async () => {
      addDocument({ id: 'doc-1', status: 'PENDING_APPROVAL' });
      addDocument({ id: 'doc-2', status: 'PENDING_APPROVAL' });
      addDocument({ id: 'doc-3', status: 'APPROVED' });

      const result = await service.countPendingApproval(PROJECT, ACTOR);

      expect(result.count).toBe(2);
    });

    it('returns zero for someone who cannot approve', async () => {
      canManage = false;
      addDocument({ id: 'doc-1', status: 'PENDING_APPROVAL' });

      const result = await service.countPendingApproval(PROJECT, ACTOR);

      expect(result.count).toBe(0);
    });
  });
});
