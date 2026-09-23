import {
  IoCreateOutline,
  IoFolderOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import type { BackendFolder } from '../../../lib/api';
import { ActionMenu } from '../../../components/ui/ActionMenu';

interface Props {
  folders: BackendFolder[];
  parentId: string | null;
  level: number;
  selectedId: string | null;
  onSelect: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onRename: (folderId: string) => void;
}
export const FolderTree = ({
  folders,
  parentId,
  level,
  selectedId,
  onSelect,
  onAddSubfolder,
  onDeleteFolder,
  onRename,
}: Props) => {
  const children = folders.filter((f) => f.parentId === parentId);
  return (
    <>
      {children.map((folder) => (
        <div key={folder.id}>
          <div className="group flex items-center">
            <button
              type="button"
              title={folder.name}
              onClick={() => onSelect(folder.id)}
              style={{ paddingLeft: 12 + level * 16 }}
              className={`flex flex-1 items-center gap-2 rounded py-2 pr-3 text-left text-sm min-w-0 ${
                folder.id === selectedId
                  ? 'bg-lightGreen text-darkGreen'
                  : 'text-dark hover:bg-gray-50'
              }`}
            >
              <IoFolderOutline className="h-4 w-4 shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
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
                  label: 'Usun folder',
                  icon: <IoTrashOutline className="h-4 w-4" />,
                  onSelect: () => onDeleteFolder(folder.id),
                },
              ]}
            />
          </div>
          <FolderTree
            folders={folders}
            parentId={folder.id}
            level={level + 1}
            selectedId={selectedId}
            onSelect={onSelect}
            onAddSubfolder={onAddSubfolder}
            onDeleteFolder={onDeleteFolder}
            onRename={onRename}
          />
        </div>
      ))}
    </>
  );
};
