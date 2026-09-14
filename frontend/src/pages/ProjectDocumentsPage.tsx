import { useState } from 'react';
import { useFolders } from '../features/documents/hooks/useFolders';
import { useDocuments } from '../features/documents/hooks/useDocuments';
import { useAuthToken } from '../context/useAuthToken';
import { api, isApiError } from '../lib/api';
import {
  DOCUMENT_KINDS_OPTIONS,
  type DocumentKind,
} from '../lib/documents';
import { useUploadDocument } from '../features/documents/hooks/useUploadDocument';
import { DocumentsTable } from '../features/documents/components/DocumentsTable';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { formatFileSize } from '../features/documents/utils/formatters';
import { IoCloudUploadOutline, IoFolderOutline } from 'react-icons/io5';
import { Select } from '../components/ui/Select';
import toast from 'react-hot-toast';
const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
export default function ProjectDocumentsPage() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const { requireToken } = useAuthToken();
  const { data: folders, isPending: foldersPending } = useFolders(PROJECT_ID);
  const { data: documents, isPending: documentsPending } = useDocuments(
    PROJECT_ID,
    folderId,
  );
  const [name, setName] = useState('');
  const [kind, setKind] = useState<DocumentKind>('CONTRACT');
  const [file, setFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const upload = useUploadDocument(PROJECT_ID, folderId ?? '');
  const clear = () => {
    setName("");
    setShowUpload(false)
setFile(null)
  }
  const down = async (
    documentId: string,
    versionNo: number,
    fileName: string,
  ) => {
    try{
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

    }catch(error) {
        const message =error instanceof Error && isApiError(error)
          ? error.message
          : 'Coś poszło nie tak';
        toast.error(message);
    }
  };

  const uploadDoc = () => {
    if (!file) {
      return null;
    }
    upload.mutate(
      { name, kind, file },
      {
        onSuccess: () => {
        clear()
        },
        onError:(error) => {
            const message = isApiError(error)
              ? error.message
              : 'Coś poszło nie tak'; 
            toast.error(message);
        }
      },
    );
  };

  if (foldersPending) {
    return <p>Loading...</p>;
  }
  if (!folders) {
    return null;
  }

  const nameFolder = folders.find((el) => el.id === folderId)?.name;

  const bytes =
    documents?.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.versions[0].sizeBytes,
      0,
    ) ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Szlak rowerowy Solina–Polańczyk
          </p>
          <h1 className="mt-1 text-2xl font-bold text-dark">Dokumenty</h1>
        </div>

        <Button
          variant="primary"
          size="small"
          onClick={() => setShowUpload(true)}
          disabled={!folderId}
        >
          <IoCloudUploadOutline className="h-4 w-4" />
          Wgraj plik
        </Button>
      </div>

      <div className="flex gap-6">
        <aside className="w-64 shrink-0 rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-xs uppercase tracking-wide text-gray-400">
            Foldery
          </p>
          <div className="flex flex-col gap-1">
            {folders.map((el) => (
              <button
                type="button"
                key={el.id}
                onClick={() => setFolderId(el.id)}
                className={`flex items-center gap-2 rounded px-3 py-2 text-left text-sm ${
                  el.id === folderId
                    ? 'bg-lightGreen text-darkGreen'
                    : 'text-dark hover:bg-gray-50'
                }`}
              >
                <IoFolderOutline className="h-4 w-4 shrink-0" />
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

          {folderId && (
            <div className="border-b border-gray-200 px-4 py-4">
              <p className="text-base font-semibold text-dark">{nameFolder}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {documents?.length ?? 0} dokumentów · {formatFileSize(bytes)}
              </p>
            </div>
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

      <Modal
        isOpen={showUpload}
        onClose={clear}
        title="Wgraj plik"
      >
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
            <Select
              options={DOCUMENT_KINDS_OPTIONS}
              value={kind}
              onChange={(v) => setKind(v as DocumentKind)}
              placeholder="Wybierz rodzaj"
            />
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
          <Button
            variant="ghost"
            size="small"
            onClick={() => clear}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={uploadDoc}
            disabled={!name || !file || !kind}
            isPending={upload.isPending}
          >
            Wgraj
          </Button>
        </div>
      </Modal>
    </div>
  );
}
