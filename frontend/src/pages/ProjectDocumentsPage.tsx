import { useState } from "react";
import { useFolders } from "../features/documents/hooks/useFolders";
import { useDocuments } from "../features/documents/hooks/useDocuments";
import { useAuthToken } from "../context/useAuthToken";
import { api} from "../lib/api";
import { DOCUMENT_KIND_LABELS, DOCUMENT_KINDS, type DocumentKind } from "../lib/documents";
import { useUploadDocument } from "../features/documents/hooks/useUploadDocument";
import { DocumentsTable } from "../features/documents/components/DocumentsTable";
  const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
export default function ProjectDocumentsPage() {



  const [folderId, setFolderId] = useState<string | null>(null);
  const { requireToken } = useAuthToken();
const { data: folders, isPending: foldersPending } = useFolders(PROJECT_ID);
const { data: documents, isPending: documentsPending } = useDocuments(PROJECT_ID, folderId);
const [name, setName] = useState('');
const [kind, setKind] = useState<DocumentKind>('CONTRACT');
const [file, setFile] = useState<File | null>(null);

const upload = useUploadDocument(PROJECT_ID, folderId ?? '');
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

const uploadDoc = ( ) => {
  if(!file){
    return null
  }
 upload.mutate({name, kind,file})
}

if(foldersPending){
  return <p>Loading...</p>
}
if(!folders){
  return null
}

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as DocumentKind)}
      >
        {DOCUMENT_KINDS.map((k) => (
          <option key={k} value={k}>
            {DOCUMENT_KIND_LABELS[k]}
          </option>
        ))}
        <option value=""></option>
      </select>

      <input
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        type="file"
      ></input>

      <input type="text" onChange={(e) => setName(e.target.value)} />
      {upload.error && <p style={{ color: 'red' }}>{upload.error.message}</p>}
      {upload.isPending && <p>Wysyłam...</p>}
      <button onClick={() => uploadDoc()}>Wgraj</button>

      {folders.map((el) => (
        <button key={el.id} onClick={() => setFolderId(el.id)}>
          {el.name}
        </button>
      ))}
      <div>
        {!folderId && <p>Wybierz folder</p>}
        {folderId && documentsPending && <p>Ładowanie...</p>}

        {documents && (
          <DocumentsTable documents={documents} onDownload={down} />
        )}
      </div>
    </div>
  );
}
