import { useState } from "react";
import { useFolders } from "../features/documents/hooks/useFolders";
import { useDocuments } from "../features/documents/hooks/useDocuments";
import { useAuthToken } from "../context/useAuthToken";
import { api} from "../lib/api";
  const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
export default function ProjectDocumentsPage() {



  const [folderId, setFolderId] = useState<string | null>(null);
  const { requireToken } = useAuthToken();
const { data: folders, isPending: foldersPending } = useFolders(PROJECT_ID);
const { data: documents, isPending: documentsPending } = useDocuments(PROJECT_ID, folderId);

const down = async (
  documentId: string,
  versionNo: number,
  fileName: string,
) => {
  const blob = await api.downloadVersion(
    requireToken(),
    PROJECT_ID,
    documentId,
    versionNo,
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
 a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}; 

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

        {documents &&
          documents.map((el) => (
            <div key={el.id}>
              <p>{el.name}</p>
              <button
                onClick={() =>
                  down(el.id, el.versions[0].versionNo, el.versions[0].fileName)
                }
              >Pobierz</button>
            </div>
          ))}
      </div>
    </div>
  );
}
