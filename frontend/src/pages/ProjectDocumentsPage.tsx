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
import { IoCloudUploadOutline,IoInformationCircleOutline, IoTrashOutline } from 'react-icons/io5';
import { Select } from '../components/ui/Select';
import toast from 'react-hot-toast';
import { useUploadVersion } from '../features/documents/hooks/useUploadVersion';
import { FileDropzone } from '../components/ui/FileDropzone';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../components/ui/formStyles';
import { FolderTree } from '../features/documents/components/FolderTree';
import { useCreateFolder } from '../features/documents/hooks/useCreateFolder';
import { useDeleteFolder } from '../features/documents/hooks/useDeleteFolder';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useUpdateFolder } from '../features/documents/hooks/useUpdateFolder';
import { useDeleteDocument } from '../features/documents/hooks/useDeleteDocument';
import { useTrash } from '../features/documents/hooks/useTrash';



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
const [expandedIds, setExpandedIds] = useState<string[]>([]);
const [versionForId, setVersionForId] = useState<string | null>(null);
const [changeNote, setChangeNote] = useState('');
const [mode, setMode] = useState<'document' | 'version'>('document');
const [showNewFolder, setShowNewFolder] = useState(false);
const [newFolderName, setNewFolderName] = useState('');
const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);

const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null)
const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);


const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
const [renameFolderName, setRenameFolderName] = useState('');

const [showTrash, setShowTrash] = useState(false)

const {data: trash} = useTrash(PROJECT_ID)
const updateFolder = useUpdateFolder(PROJECT_ID);

const deleteDocument = useDeleteDocument(PROJECT_ID, folderId ?? '');

const clearDeleteDocument  = ()=> {
  setDeleteDocumentId(null)
}

const delDocument = () => {
    if (deleteDocumentId === null) {
      return;
    }
    deleteDocument.mutate(deleteDocumentId, {
      onSuccess: () => {
        clearDeleteDocument();
      },
      onError: (error) => {
        const message = isApiError(error)
          ? error.message
          : 'Coś poszło nie tak';
        toast.error(message);
      },
    });
}


const selectFolder = (folderId: string) => {
  setFolderId(folderId)
  setShowTrash(false)
};


const openRename = (folderId: string) => {

  setRenameFolderId(folderId)
  const currentName = folders?.find((el) => el.id === folderId)?.name ?? '';
  setRenameFolderName(currentName);


};
const clearRename = () => {
  setRenameFolderId(null);
  setRenameFolderName('');
};
const submitRename = () => {
  if (renameFolderId === null || renameFolderName.trim() === '') {
    return;
  }
updateFolder.mutate({
  folderId: renameFolderId,
  name: renameFolderName.trim()
},
{
  onSuccess: () => {
    clearRename()
  },
  onError: (error) => {
const message = isApiError(error) ? error.message : 'Coś poszło nie tak';
toast.error(message);
  }
}
)

};
const createFolder = useCreateFolder(
  PROJECT_ID
)
const uploadVersion = useUploadVersion                (
  PROJECT_ID,
  folderId ?? '',
  versionForId ?? '',
);
const uploadNewVersion = () => {
  if (!file) {
    return;
  }
  uploadVersion.mutate(
    { file, changeNote },
    {
      onSuccess: () => clear(),
      onError: (error) => {
        const message = isApiError(error)
          ? error.message
          : 'Coś poszło nie tak';
        toast.error(message);
      },
    },
  );
};

const clearDelete = () => {
  setDeleteFolderId(null)
};

const deleteFolder = useDeleteFolder(PROJECT_ID)


const delFolder = () => {
  if (deleteFolderId === null) {
    return;
  }
  deleteFolder.mutate(
 deleteFolderId,
    {
      onSuccess: () => {
        if(folderId === deleteFolderId){
          setFolderId(null)
        }
        clearDelete();
      },
      onError: (error) => {
      const message = isApiError(error) ? error.message : 'Coś poszło nie tak';
      toast.error(message);

      },
    },
  );
}

const deleteFolderName = folders?.find((el) => el.id === deleteFolderId)?.name;

const openNewFolder = (parentId: string | null) => {

setNewFolderParentId(parentId)
setShowNewFolder(true)
};

const clearNewFolder = () => {
setShowNewFolder(false)
setNewFolderParentId(null)
setNewFolderName("")
};

const submitNewFolder = () => {
  if (newFolderName.trim() === '') {
    return;
  }
  const payload: { name: string; parentId?: string } = {
    name: newFolderName.trim(),
  };
  if (newFolderParentId) {
    payload.parentId = newFolderParentId;
  }
  createFolder.mutate(payload, {
    onSuccess: () => clearNewFolder(),
    onError: (error) => {
      const message = isApiError(error) ? error.message : 'Coś poszło nie tak';
      toast.error(message);
    },
  });
};

const deleteDocumentName  = documents?.find(el => el.id === deleteDocumentId)?.name

const toggleExpanded = (documentId: string) => {
  if(expandedIds.includes(documentId)){
const newExpandsIds = expandedIds.filter((el) => el !== documentId);
setExpandedIds(newExpandsIds)
  }else{
  setExpandedIds([...expandedIds, documentId])
  }
};
  const upload = useUploadDocument(PROJECT_ID, folderId ?? '');
  const clear = () => {
    setShowUpload(false);
    setName('');
    setFile(null);
    setChangeNote('');
    setVersionForId(null);
    setMode('document');
  };
  
  const openNewVersion = (documentId: string) => {
    setVersionForId(documentId);
    setMode('version');
    setShowUpload(true);
  };


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

 const documentOptions = 
   documents?.map((doc) => ({
     value: doc.id,
     label: doc.versions[0]
       ? `${doc.name} (v${doc.versions[0].versionNo})`
       : doc.name,
   })) ?? [];

  const nextVersionNo = versionForId
    ? (documents?.find((doc) => doc.id === versionForId)?.versions[0]
        ?.versionNo ?? 0) + 1
    : null;


  const bytes =
    documents?.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.versions[0].sizeBytes,
      0,
    ) ?? 0;
const parentFolderName = folders.find((el) => el.id === newFolderParentId)?.name

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
        <aside className="w-72 shrink-0 rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Foldery
            </p>
            <button
              type="button"
              onClick={() => openNewFolder(null)}
              className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
            >
              + Nowy folder
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <FolderTree
              folders={folders}
              parentId={null}
              level={0}
              selectedId={showTrash ? null : folderId}
              onSelect={selectFolder}
              onAddSubfolder={openNewFolder}
              onDeleteFolder={setDeleteFolderId}
              onRename={openRename}
            />
          </div>
          <div className="my-2 border-t border-gray-200" />
          <button
            type="button"
            onClick={() => setShowTrash(true)}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${showTrash ? 'bg-lightGreen text-darkGreen' : 'text-dark hover:bg-gray-50'}`}
          >
            <IoTrashOutline className="h-4 w-4 shrink-0" />
            Kosz
          </button>
        </aside>
        <section className="flex-1 rounded-lg border border-gray-200 bg-white">
          {showTrash && (
            <div className="border-b border-gray-200 px-4 py-4">
              <p className="text-base font-semibold text-dark">Kosz</p>

              <p className="mt-0.5 text-xs text-gray-400">
                {trash?.length ?? 0} usuniętych dokumentów
              </p>
            </div>
          )}
          {showTrash && trash && (
            <DocumentsTable
              documents={trash}
              projectId={PROJECT_ID}
              onDownload={down}
              expandedIds={expandedIds}
              onToggle={toggleExpanded}
              onNewVersion={openNewVersion}
              onDeleteDocument={setDeleteDocumentId}
            />
          )}
          {!showTrash && !folderId && (
            <p className="px-4 py-10 text-center text-xs text-gray-400">
              Wybierz folder
            </p>
          )}

          {!showTrash && folderId && (
            <div className="border-b border-gray-200 px-4 py-4">
              <p className="text-base font-semibold text-dark">{nameFolder}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {documents?.length ?? 0} dokumentów · {formatFileSize(bytes)}
              </p>
            </div>
          )}
          {folderId && documentsPending && !showTrash && (
            <p className="px-4 py-10 text-center text-xs text-gray-400">
              Ładowanie...
            </p>
          )}
          {documents && !showTrash && (
            <DocumentsTable
              documents={documents}
              projectId={PROJECT_ID}
              onDownload={down}
              expandedIds={expandedIds}
              onToggle={toggleExpanded}
              onNewVersion={openNewVersion}
              onDeleteDocument={setDeleteDocumentId}
            />
          )}
        </section>
      </div>

      <Modal isOpen={showUpload} onClose={clear} title="Wgraj plik">
        <div className="space-y-5">
          <FileDropzone value={file} onChange={setFile} />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-dark/75 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'document'}
                onChange={() => setMode('document')}
                className="accent-darkGreen"
              />
              Nowy dokument
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-dark/75 cursor-pointer">
              <input
                type="radio"
                checked={mode === 'version'}
                onChange={() => setMode('version')}
                className="accent-darkGreen"
              />
              Nowa wersja
            </label>
          </div>

          {mode === 'document' && (
            <>
              <p className="text-xs text-gray-400">
                Dokument trafi do folderu:{' '}
                <span className="font-semibold text-dark">{nameFolder}</span>
              </p>

              <div>
                <label className={FIELD_LABEL_CLASSES}>
                  Nazwa dokumentu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Podaj nazwę..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={FIELD_LABEL_CLASSES}>
                    Rodzaj <span className="text-red-500">*</span>
                  </label>
                  <Select
                    size="md"
                    options={DOCUMENT_KINDS_OPTIONS}
                    value={kind}
                    onChange={(v) => setKind(v as DocumentKind)}
                    placeholder="Wybierz"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'version' && (
            <>
              <div>
                <label className={FIELD_LABEL_CLASSES}>
                  Dokument, do którego dodajesz wersję:{' '}
                  <span className="text-red-500">*</span>
                </label>
                <Select
                  size="md"
                  options={documentOptions}
                  value={versionForId ?? ''}
                  onChange={(v) => setVersionForId(v)}
                  placeholder="Wybierz"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Lista zawiera dokumenty z folderu:{' '}
                  <span className="font-semibold text-dark">{nameFolder}</span>
                </p>
              </div>
              {nextVersionNo && (
                <div className="flex items-center gap-2 rounded-lg bg-lightGreen px-3 py-2 text-xs text-darkGreen">
                  <IoInformationCircleOutline className="h-4 w-4 shrink-0" />
                  <span>
                    Zostanie zapisana jako{' '}
                    <span className="font-bold">v{nextVersionNo}</span>,
                    poprzednie wersje pozostaną w historii
                  </span>
                </div>
              )}
              <div>
                <label className={FIELD_LABEL_CLASSES}>Opis zmiany</label>
                <input
                  type="text"
                  placeholder="Dodaj notatkę, np. Uzupełniono załącznik nr 2"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  className={INPUT_CLASSES}
                />
              </div>
            </>
          )}

          <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={clear}
            >
              Anuluj
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={mode === 'document' ? uploadDoc : uploadNewVersion}
              disabled={
                mode === 'document'
                  ? !name || !file || !kind
                  : !file || !versionForId
              }
              isPending={
                mode === 'document' ? upload.isPending : uploadVersion.isPending
              }
              className="font-medium!"
            >
              Zapisz
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showNewFolder}
        onClose={clearNewFolder}
        title="Nowy folder"
      >
        <div className="space-y-5">
          <p className="text-xs text-gray-400">
            Folder powstanie{' '}
            <span className="font-semibold text-dark">
              {!newFolderParentId
                ? 'na głównym poziomie'
                : `w folderze ${parentFolderName}`}
            </span>
          </p>

          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Nazwa folderu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Podaj nazwę..."
              maxLength={40}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className={INPUT_CLASSES}
            />
          </div>

          <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={clearNewFolder}
            >
              Anuluj
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={submitNewFolder}
              disabled={newFolderName.trim() === '' || createFolder.isPending}
              isPending={createFolder.isPending}
              className="font-medium!"
            >
              Zapisz
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={renameFolderId !== null}
        onClose={clearRename}
        title="Zmień nazwę"
      >
        <div className="space-y-5">
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Nazwa folderu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Podaj nazwę..."
              maxLength={40}
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              className={INPUT_CLASSES}
            />
          </div>

          <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={clearRename}
            >
              Anuluj
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={submitRename}
              disabled={renameFolderName.trim() === ''}
              isPending={updateFolder.isPending}
              className="font-medium!"
            >
              Zapisz
            </Button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        tone="danger"
        isPending={deleteFolder.isPending}
        isOpen={deleteFolderId !== null}
        onClose={clearDelete}
        onConfirm={delFolder}
        title="Usuń folder"
        description={`Czy na pewno chcesz usunąć folder „${deleteFolderName}"?`}
        confirmLabel="Usuń"
      />
      <ConfirmDialog
        tone="danger"
        isPending={deleteDocument.isPending}
        isOpen={deleteDocumentId !== null}
        onClose={clearDeleteDocument}
        onConfirm={delDocument}
        title="Usuń dokument"
        description={`Czy na pewno chcesz usunąć dokument „${deleteDocumentName}"?`}
        confirmLabel="Usuń"
      />
    </div>
  );
}
