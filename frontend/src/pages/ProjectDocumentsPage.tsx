import { useState } from 'react';
import { useFolders } from '../features/documents/hooks/useFolders';
import { useDocuments } from '../features/documents/hooks/useDocuments';
import { useAuthToken } from '../context/useAuthToken';
import { api } from '../lib/api';
import { DocumentsTable } from '../features/documents/components/DocumentsTable';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { formatFileSize } from '../features/documents/utils/formatters';
import { IoCloudUploadOutline, IoTrashOutline } from 'react-icons/io5';
import { Select } from '../components/ui/Select';
import { FIELD_LABEL_CLASSES } from '../components/ui/formStyles';
import { FolderTree } from '../features/documents/components/FolderTree';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { showError, showSuccess } from '../features/documents/utils/toasts';
import { useTrash } from '../features/documents/hooks/useTrash';
import { useRestoreDocument } from '../features/documents/hooks/useRestoreDocument';
import { useDeleteDocumentPermanently } from '../features/documents/hooks/useDeleteDocumentPermanently';
import { useRestoreVersion } from '../features/documents/hooks/useRestoreVersion';
import { DeleteDocumentDialog } from '../features/documents/components/DeleteDocumentDialog';
import { DeleteFolderDialog } from '../features/documents/components/DeleteFolderDialog';
import { CreateFolderModal } from '../features/documents/components/CreateFolderModal';
import { RenameFolderModal } from '../features/documents/components/RenameFolderModal';
import { RenameDocumentModal } from '../features/documents/components/RenameDocumentModal';
import {
  UploadDocumentModal,
  type UploadMode,
} from '../features/documents/components/UploadDocumentModal';
import { useSelectedProject } from '../context/useSelectedProject';
import { PageMessage } from '../components/ui/PageMessage';
import { useProject } from '../features/projects/hooks/useProjectsApi';
import { useApproveDocument } from '../features/documents/hooks/useApproveDocument';

function DocumentsView({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);

  const [folderId, setFolderId] = useState<string | null>(null);
  const { requireToken } = useAuthToken();
  const { data: folders, isPending: foldersPending } = useFolders(projectId);
  const { data: documents, isPending: documentsPending } = useDocuments(
    projectId,
    folderId,
  );

  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('document');
  const [uploadDocumentId, setUploadDocumentId] = useState<string | null>(null);

  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(
    null,
  );

  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);

  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [restoreDocumentId, setRestoreDocumentId] = useState<string | null>(
    null,
  );
  const [restoreFolderId, setRestoreFolderId] = useState('');

  const [showTrash, setShowTrash] = useState(false);

  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(
    null,
  );

  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);

  const { data: trash } = useTrash(projectId);

  const restoreDocument = useRestoreDocument(projectId);

  const deletePermanentlyDocument = useDeleteDocumentPermanently(projectId);

  const restoreVersionMutation = useRestoreVersion(projectId);

const apprveDocument = useApproveDocument(projectId, folderId ?? "")

  const clearPermanentDelete = () => {
    setPermanentDeleteId(null);
  };
  const delPermanentlyDoc = () => {
    if (permanentDeleteId === null) {
      return;
    }
    deletePermanentlyDocument.mutate(permanentDeleteId, {
      onSuccess: () => {
        showSuccess('Dokument usunięty na zawsze');
        clearPermanentDelete();
      },
      onError: showError,
    });
  };

  const clearRestore = () => {
    setRestoreDocumentId(null);
    setRestoreFolderId('');
  };

  const restore = (documentId: string) => {
    if (restoreDocument.isPending) {
      return;
    }
    const doc = trash?.find((el) => el.id === documentId);
    if (doc?.folder?.deletedAt) {
      setRestoreDocumentId(documentId);
      return;
    }
    restoreDocument.mutate(
      { documentId },
      {
        onSuccess: () => showSuccess('Dokument przywrócony'),
        onError: showError,
      },
    );
  };

  const restoreVersion = (documentId: string, versionNo: number) => {
    if (restoreVersionMutation.isPending) {
      return;
    }
    restoreVersionMutation.mutate(
      { documentId, versionNo },
      {
        onSuccess: () => showSuccess('Wersja przywrócona'),
        onError: showError,
      },
    );
  };

  const approve = (documentId: string) => {
        if (apprveDocument.isPending) {
          return;
        }
apprveDocument.mutate(documentId,
  {
    onSuccess: () => showSuccess('Dokument zatwierdzony'),
     onError: showError,
  }
);
        
  }

  const submitRestore = () => {
    if (restoreDocumentId === null || restoreFolderId === '') {
      return;
    }
    restoreDocument.mutate(
      { documentId: restoreDocumentId, folderId: restoreFolderId },
      {
        onSuccess: () => {
          showSuccess('Dokument przywrócony');
          clearRestore();
        },

        onError: showError,
      },
    );
  };

  const selectFolder = (folderId: string) => {
    setFolderId(folderId);
    setShowTrash(false);
  };

  const deleteFolderName = folders?.find(
    (el) => el.id === deleteFolderId,
  )?.name;
  const renameDocumentName =
    documents?.find((el) => el.id === renameDocumentId)?.name ?? '';

  const renameFolderName =
    folders?.find((el) => el.id === renameFolderId)?.name ?? '';

  const openNewFolder = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setShowNewFolder(true);
  };

  const deleteDocumentName = documents?.find(
    (el) => el.id === deleteDocumentId,
  )?.name;

  const toggleExpanded = (documentId: string) => {
    if (expandedIds.includes(documentId)) {
      const newExpandsIds = expandedIds.filter((el) => el !== documentId);
      setExpandedIds(newExpandsIds);
    } else {
      setExpandedIds([...expandedIds, documentId]);
    }
  };

  const down = async (
    documentId: string,
    versionNo: number,
    fileName: string,
  ) => {
    try {
      const blob = await api.downloadVersion(
        requireToken(),
        projectId,
        documentId,
        versionNo,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      showError(error as Error);
    }
  };

  const openUpload = () => {
    setUploadMode('document');
    setUploadDocumentId(null);
    setShowUpload(true);
  };

  const openNewVersion = (documentId: string) => {
    setUploadMode('version');
    setUploadDocumentId(documentId);
    setShowUpload(true);
  };

  const preview = async (documentId: string, versionNo: number) => {
    const tab = window.open('', '_blank');

    try {
      const blob = await api.downloadVersion(
        requireToken(),
        projectId,
        documentId,
        versionNo,
      );

      const url = URL.createObjectURL(blob);

      if (tab) {
        tab.location.href = url;
      }
    } catch (error) {
      tab?.close();
      showError(error as Error);
    }
  };

  if (foldersPending) {
    return (
      <p className="px-4 py-10 text-center text-xs text-gray-400">
        Ładowanie...
      </p>
    );
  }
  if (!folders) {
    return null;
  }

  const nameFolder = folders.find((el) => el.id === folderId)?.name;
  const permanentDeleteName = trash?.find(
    (el) => el.id === permanentDeleteId,
  )?.name;

  const folderOptions = folders?.map((folder) => ({
    value: folder.id,
    label: folder.name,
  }));

  const bytes =
    documents?.reduce(
      (accumulator, currentValue) =>
        accumulator + (currentValue.versions[0]?.sizeBytes ?? 0),
      0,
    ) ?? 0;
  const parentFolderName = folders.find(
    (el) => el.id === newFolderParentId,
  )?.name;
  const del = (id: string) => {
    if (id === folderId) {
      setFolderId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {project?.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-dark">Dokumenty</h1>
        </div>

        <Button
          variant="primary"
          size="small"
          onClick={openUpload}
          disabled={!folderId || showTrash}
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
              onRename={setRenameFolderId}
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
              projectId={projectId}
              onDownload={down}
              expandedIds={expandedIds}
              onToggle={toggleExpanded}
              onNewVersion={openNewVersion}
              onDeleteDocument={setDeleteDocumentId}
              onRestoreDocument={restore}
              variant="trash"
              onDeletePermanently={setPermanentDeleteId}
              onPreview={preview}
              onRestoreVersion={restoreVersion}
              onRenameDocument={setRenameDocumentId}
              onApprove={approve}
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
              projectId={projectId}
              onDownload={down}
              expandedIds={expandedIds}
              onToggle={toggleExpanded}
              onNewVersion={openNewVersion}
              onDeleteDocument={setDeleteDocumentId}
              onRestoreDocument={restore}
              variant="folder"
              onDeletePermanently={setPermanentDeleteId}
              onRenameDocument={setRenameDocumentId}
              onPreview={preview}
              onRestoreVersion={restoreVersion}
              onApprove={approve}
            />
          )}
        </section>
      </div>

      <RenameFolderModal
        projectId={projectId}
        folderId={renameFolderId}
        currentName={renameFolderName}
        onClose={() => setRenameFolderId(null)}
      />

      <Modal
        isOpen={restoreDocumentId !== null}
        onClose={clearRestore}
        title="Przywróć dokument"
      >
        <div className="space-y-5">
          <p className="text-sm text-dark/75">
            Folder tego dokumentu został usunięty. Wybierz, gdzie go przywrócić.
          </p>

          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Folder <span className="text-red-500">*</span>
            </label>
            <Select
              size="md"
              options={folderOptions}
              value={restoreFolderId}
              onChange={(v) => setRestoreFolderId(v)}
              placeholder="Wybierz"
            />
          </div>

          <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={clearRestore}
            >
              Anuluj
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={submitRestore}
              disabled={restoreFolderId === ''}
              isPending={restoreDocument.isPending}
              className="font-medium!"
            >
              Przywróć
            </Button>
          </div>
        </div>
      </Modal>
      <UploadDocumentModal
        key={
          showUpload ? `${uploadMode}-${uploadDocumentId ?? 'new'}` : 'closed'
        }
        isOpen={showUpload}
        projectId={projectId}
        folderId={folderId ?? ''}
        folderName={nameFolder}
        documents={documents ?? []}
        initialMode={uploadMode}
        initialDocumentId={uploadDocumentId}
        onClose={() => setShowUpload(false)}
      />

      <RenameDocumentModal
        projectId={projectId}
        folderId={folderId ?? ''}
        documentId={renameDocumentId}
        currentName={renameDocumentName}
        onClose={() => setRenameDocumentId(null)}
      />

      <CreateFolderModal
        projectId={projectId}
        isOpen={showNewFolder}
        parentId={newFolderParentId}
        parentName={parentFolderName}
        onClose={() => {
          setShowNewFolder(false);
          setNewFolderParentId(null);
        }}
      />

      <DeleteFolderDialog
        projectId={projectId}
        folderId={deleteFolderId}
        folderName={deleteFolderName}
        onClose={() => setDeleteFolderId(null)}
        onDeleted={del}
      />

      <DeleteDocumentDialog
        projectId={projectId}
        folderId={folderId ?? ''}
        documentId={deleteDocumentId}
        documentName={deleteDocumentName}
        onClose={() => setDeleteDocumentId(null)}
      />

      <ConfirmDialog
        tone="danger"
        isPending={deletePermanentlyDocument.isPending}
        isOpen={permanentDeleteId !== null}
        onClose={clearPermanentDelete}
        onConfirm={delPermanentlyDoc}
        title="Usuń trwale"
        description={`Dokument „${permanentDeleteName}" i wszystkie jego wersje zostaną usunięte na zawsze. Tej operacji nie da się cofnąć.`}
        confirmLabel="Usuń trwale"
      />
    </div>
  );
}

export default function ProjectDocumentsPage() {
  const { projectId } = useSelectedProject();

  if (!projectId) {
    return (
      <PageMessage message="Nie wybrano projektu. Wybierz go na liście projektów." />
    );
  }

  return <DocumentsView projectId={projectId} />;
}
