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
