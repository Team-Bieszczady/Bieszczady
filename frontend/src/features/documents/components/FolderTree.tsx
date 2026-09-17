import { IoFolderOutline } from "react-icons/io5";
import type { BackendFolder } from "../../../lib/api";
import { ActionMenu } from "../../../components/ui/ActionMenu";

interface Props {
  folders: BackendFolder[];
  parentId: string | null;
  level: number;
  selectedId: string | null;
  onSelect: (folderId: string) => void;
  onAddSubfolder: (parentId: string) => void;
}
export const FolderTree = ({folders, parentId, level, selectedId, onSelect,onAddSubfolder}: Props)=> {



    
    const children = folders.filter((f) => f.parentId === parentId);
    return (
      <>
        {children.map((folder) => (
          <div key={folder.id}>
            <div className="group flex items-center">
              <button
                type="button"
                onClick={() => onSelect(folder.id)}
                style={{ paddingLeft: 12 + level * 16 }}
                className={`flex flex-1 items-center gap-2 rounded py-2 pr-3 text-left text-sm ${
                  folder.id === selectedId
                    ? 'bg-lightGreen text-darkGreen'
                    : 'text-dark hover:bg-gray-50'
                }`}
              >
                <IoFolderOutline className="h-4 w-4 shrink-0" />
                {folder.name}
              </button>
           <ActionMenu
  ariaLabel={`Akcje folderu ${folder.name}`}
  className="opacity-0 group-hover:opacity-100"
  items={[
    {
      id: 'add-subfolder',
      label: 'Dodaj podfolder',
      icon: <IoFolderOutline className="h-4 w-4" />,
      onSelect: () => onAddSubfolder(folder.id)
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
            />
          </div>
        ))}
      </>
    );







    
};
