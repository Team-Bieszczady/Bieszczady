import type { BackendFolder } from '../../../lib/api';

export function folderList(folders: BackendFolder[], ids: string[]) {
  const names = ids.map(
    (id) => `„${folders.find((el) => el.id === id)?.name ?? ''}”`,
  );
  const last = names.pop() ?? '';
  const joined = names.length > 0 ? `${names.join(', ')} i ${last}` : last;
  return `${ids.length > 1 ? 'foldery' : 'folder'} ${joined}`;
}
