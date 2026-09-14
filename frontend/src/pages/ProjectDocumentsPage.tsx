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
const [showUpload, setShowUpload] = useState(false);

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
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Szlak rowerowy Solina–Polańczyk
          </p>
          <h1 className="mt-1 text-2xl font-bold text-dark">Dokumenty</h1>
        </div>

        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="rounded-lg bg-darkGreen px-4 py-2 text-sm font-medium text-white hover:bg-darkGreenHover"
        >
          Wgraj plik
        </button>
      </div>

      <div className="flex gap-6">
        <aside className="w-64 shrink-0 rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">
            Foldery
          </p>
          <div className="flex flex-col gap-1">
            {folders.map((el) => (
              <button
                className={`rounded px-3 py-2 text-left text-sm ${
                  el.id === folderId
                    ? 'bg-lightGreen text-darkGreen'
                    : 'text-dark hover:bg-gray-50'
                }`}
                key={el.id}
                onClick={() => setFolderId(el.id)}
              >
                {el.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex-1 rounded-lg border border-gray-200 bg-white">
          {!folderId && (
            <p className="px-4 py-10 text-center text-xs text-gray-400">
              Wybierz folder
            </p>
          )}
          {folderId && documentsPending && (
            <p className="px-4 py-10 text-center text-xs text-gray-400">
              Ładowanie...
            </p>
          )}
          {documents && (
            <DocumentsTable documents={documents} onDownload={down} />
          )}
        </section>
      </div>

      {showUpload && (
<div className="rounded-lg border border-gray-200 bg-white p-4">
  <p className="mb-4 text-sm font-semibold text-dark">Wgraj plik</p>

  <div className="flex flex-col gap-3">
    <label className="flex flex-col gap-1 text-xs text-gray-600">
      Nazwa dokumentu
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border border-gray-200 px-3 py-2 text-sm text-dark"
      />
    </label>

    <label className="flex flex-col gap-1 text-xs text-gray-600">
      Rodzaj
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as DocumentKind)}
        className="rounded border border-gray-200 px-3 py-2 text-sm text-dark"
      >
        {DOCUMENT_KINDS.map( e => <option key={e} value={e}>{DOCUMENT_KIND_LABELS[e]}</option>)}

      </select>
    </label>

    <label className="flex flex-col gap-1 text-xs text-gray-600">
      Plik
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
    </label>
  </div>

  <div className="mt-4 flex justify-end gap-2">
    <button
      type="button"
      onClick={() => setShowUpload(false)}
      className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
    >
      Anuluj
    </button>
    <button
      type="button"
      onClick={uploadDoc}
      disabled={!name || !file}
      className="rounded-lg bg-darkGreen px-4 py-2 text-sm font-medium text-white hover:bg-darkGreenHover disabled:cursor-not-allowed disabled:opacity-50"
    >
      Wgraj
    </button>
  </div>
  
</div>
      
  )
}
</div>
)}