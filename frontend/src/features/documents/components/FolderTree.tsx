import { IoFolderOutline } from "react-icons/io5";
import type { BackendFolder } from "../../../lib/api";

interface Props {
  folders: BackendFolder[]; 
  parentId: string | null; 
  level: number; 
  selectedId: string | null;
  onSelect: (folderId: string) => void;
}
export const FolderTree = ({folders, parentId, level, selectedId, onSelect}: Props)=> {



    
    const children = folders.filter((f) => f.parentId === parentId);
    return (
      <>
        {children.map((folder) => (
          <div key={folder.id}>
            <button
              type="button"
              onClick={() => onSelect(folder.id)}
              style={{ paddingLeft: 12 + level * 16 }}
              className={`flex w-full items-center gap-2 rounded py-2 pr-3 text-left text-sm ${
                folder.id === selectedId
                  ? 'bg-lightGreen text-darkGreen'
                  : 'text-dark hover:bg-gray-50'
              }`}
            >
              <IoFolderOutline className="h-4 w-4 shrink-0" />
              {folder.name}
            </button>

            <FolderTree
              folders={folders}
              parentId={folder.id}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          </div>
        ))}
      </>
    );







    
};
