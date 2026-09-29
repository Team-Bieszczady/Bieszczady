import {
  IoChevronDown,
  IoChevronForward,
  IoCreateOutline,
  IoFolderOutline,
  IoMoveOutline,
  IoPersonAddOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import type { BackendFolder } from '../../../lib/api';
import { ActionMenu } from '../../../components/ui/ActionMenu';

interface Props {
  folders: BackendFolder[];
  parentId: string | null;
  level: number;
  selectedId: string | null;
  canManage: boolean;
  collapsedIds: string[];
  onToggleCollapsed: (folderId: string) => void;
  onSelect: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRename: (folderId: string) => void;
  onMove: (folderId: string) => void;
  onShare: (folderId: string) => void;
  draggedId: string | null;
  overId: string | null;
  onDragFolder: (folderId: string | null) => void;
  onDragOverFolder: (folderId: string | null) => void;
  onDropOnFolder: (parentId: string) => void;
}

const MAX_DEPTH = 50;

function isInsideDragged(
  folders: BackendFolder[],
  folderId: string,
  draggedId: string,
) {
  let current = folders.find((f) => f.id === folderId);
  let steps = 0;

  while (current) {
    if (current.id === draggedId) {
      return true;
    }
    if (steps++ > MAX_DEPTH) {
      return true;
    }
    const parentId: string | null = current.parentId;
    current = parentId ? folders.find((f) => f.id === parentId) : undefined;
  }

  return false;
}

export const FolderTree = ({
  folders,
  parentId,
  level,
  selectedId,
  canManage,
  collapsedIds,
  onToggleCollapsed,
  onSelect,
  onAddSubfolder,
  onDeleteFolder,
  onRename,
  onMove,
  onShare,
  draggedId,
  overId,
  onDragFolder,
  onDragOverFolder,
  onDropOnFolder,
}: Props) => {
  const children = folders.filter((f) => f.parentId === parentId);
  const draggedFolder = folders.find((f) => f.id === draggedId);

  return (
    <>
      {children.map((folder) => {
        const hasChildren = folders.some((f) => f.parentId === folder.id);
        const isCollapsed = collapsedIds.includes(folder.id);
        const canDrop =
          canManage &&
          draggedId !== null &&
          draggedFolder?.parentId !== folder.id &&
          !isInsideDragged(folders, folder.id, draggedId);

        return (
          <div key={folder.id}>
            <div
              onDragOver={(event) => {
                if (!canDrop) {
                  return;
                }
                event.preventDefault();
                onDragOverFolder(folder.id);
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget as Node)) {
                  return;
                }
                onDragOverFolder(null);
              }}
              onDrop={(event) => {
                if (!canDrop) {
                  return;
                }
                event.preventDefault();
                onDropOnFolder(folder.id);
              }}
              className={`group flex items-center rounded ${
                overId === folder.id
                  ? 'bg-lightGreen ring-2 ring-darkGreen ring-inset'
                  : folder.id === selectedId
                    ? 'bg-lightGreen'
                    : 'hover:bg-gray-50'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleCollapsed(folder.id)}
                style={{ marginLeft: 4 + level * 16 }}
                className={`shrink-0 cursor-pointer p-1 ${
                  hasChildren ? '' : 'invisible'
                }`}
                aria-label={isCollapsed ? 'Rozwiń folder' : 'Zwiń folder'}
              >
                {isCollapsed ? (
                  <IoChevronForward className="h-3.5 w-3.5 text-gray-400" />
                ) : (
                  <IoChevronDown className="h-3.5 w-3.5 text-gray-400" />
                )}
              </button>

              <button
                type="button"
                title={folder.name}
                draggable={canManage}
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', folder.id);
                  event.dataTransfer.effectAllowed = 'move';
                  onDragFolder(folder.id);
                }}
                onDragEnd={() => onDragFolder(null)}
                onClick={() => onSelect(folder.id)}
                className={`flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pr-3 pl-1 text-left text-sm ${
                  folder.id === selectedId ? 'text-darkGreen' : 'text-dark'
                }`}
              >
                <IoFolderOutline className="h-4 w-4 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>

              {folder.pendingCount > 0 && (
                <span
                  title={`Dokumenty do akceptacji: ${folder.pendingCount}`}
                  className="mr-1 shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700"
                >
                  {folder.pendingCount}
                </span>
              )}

              {canManage && (
                <ActionMenu
                  ariaLabel={`Akcje folderu ${folder.name}`}
                  className="opacity-0 group-hover:opacity-100"
                  items={[
                    {
                      id: 'add-subfolder',
                      label: 'Dodaj podfolder',
                      icon: <IoFolderOutline className="h-4 w-4" />,
                      onSelect: () => onAddSubfolder(folder.id),
                    },
                    {
                      id: 'rename-folder',
                      label: 'Zmień nazwę',
                      icon: <IoCreateOutline className="h-4 w-4" />,
                      onSelect: () => onRename(folder.id),
                    },
                    {
                      id: 'delete-folder',
                      label: 'Usuń folder',
                      icon: <IoTrashOutline className="h-4 w-4" />,
                      onSelect: () => onDeleteFolder(folder.id),
                    },
                    {
                      id: 'move-folder',
                      label: 'Przenieś',
                      icon: <IoMoveOutline className="h-4 w-4" />,
                      onSelect: () => onMove(folder.id),
                    },
                    {
                      id: 'share-folder',
                      label: 'Udostępnij',
                      icon: <IoPersonAddOutline className="h-4 w-4" />,
                      onSelect: () => onShare(folder.id),
                    },
                  ]}
                />
              )}
            </div>

            {!isCollapsed && (
              <FolderTree
                folders={folders}
                parentId={folder.id}
                level={level + 1}
                selectedId={selectedId}
                canManage={canManage}
                collapsedIds={collapsedIds}
                onToggleCollapsed={onToggleCollapsed}
                onSelect={onSelect}
                onAddSubfolder={onAddSubfolder}
                onDeleteFolder={onDeleteFolder}
                onRename={onRename}
                onMove={onMove}
                onShare={onShare}
                draggedId={draggedId}
                overId={overId}
                onDragFolder={onDragFolder}
                onDragOverFolder={onDragOverFolder}
                onDropOnFolder={onDropOnFolder}
              />
            )}
          </div>
        );
      })}
    </>
  );
};
