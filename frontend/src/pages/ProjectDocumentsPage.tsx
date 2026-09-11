import { useState } from "react";
import { useFolders } from "../features/documents/hooks/useFolders";
import { useDocuments } from "../features/documents/hooks/useDocuments";
  const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
export default function ProjectDocumentsPage() {



  const [folderId, setFolderId] = useState<string | null>(null);
const { data: folders, isPending: foldersPending } = useFolders(PROJECT_ID);
const { data: documents, isPending: documentsPending } = useDocuments(PROJECT_ID, folderId);
if(foldersPending){
  return <p>Loading...</p>
}
if(!folders){
  return
}

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {folders.map((el) => (
        <button key={el.id} onClick={() => setFolderId(el.id)}>
          {el.name}
        </button>
      ))}
      <div>
        {!folderId && <p>Wybierz folder</p>}
        {folderId && documentsPending && <p>Ładowanie...</p>}

        {documents && documents.map((el) => <p key={el.id}>{el.name}</p>)}
      </div>
    </div>
  );
}
