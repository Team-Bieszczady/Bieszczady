import type { BackendFolder } from '../../../lib/api';

export function collectSubtreeIds(folders: BackendFolder[], folderId: string) {
  const subtree = new Set([folderId]);
  let grew = true;

  while (grew) {
    grew = false;
    for (const folder of folders) {
      if (
        folder.parentId &&
        subtree.has(folder.parentId) &&
        !subtree.has(folder.id)
      ) {
        subtree.add(folder.id);
        grew = true;
      }
    }
  }

  return subtree;
}

export function collectAncestorIds(folders: BackendFolder[], folderId: string) {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const path = new Set<string>();
  let current = byId.get(folderId);

  while (current && !path.has(current.id)) {
    path.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}

export function sharedFolderIdsAbove(
  folders: BackendFolder[],
  parentId: string | null,
) {
  if (!parentId) {
    return [];
  }
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  return [...collectAncestorIds(folders, parentId)].filter(
    (id) => (byId.get(id)?.sharedWith ?? 0) > 0,
  );
}

export function accessChangeOnMove(
  folders: BackendFolder[],
  folderId: string,
  parentId: string | null,
) {
  const folder = folders.find((el) => el.id === folderId);
  if (!folder) {
    return { gains: [], losses: [] };
  }
  const before = sharedFolderIdsAbove(folders, folder.parentId);
  const after = sharedFolderIdsAbove(folders, parentId);
  return {
    gains: after.filter((id) => !before.includes(id)),
    losses: before.filter((id) => !after.includes(id)),
  };
}
