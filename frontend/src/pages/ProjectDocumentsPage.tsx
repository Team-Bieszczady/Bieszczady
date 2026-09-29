import { useState } from 'react';
import { useFolders } from '../features/documents/hooks/useFolders';
import { useDocuments } from '../features/documents/hooks/useDocuments';
import { DocumentsTable } from '../features/documents/components/DocumentsTable';
import { Button } from '../components/ui/Button';
import { formatFileSize } from '../features/documents/utils/formatters';
import { IoSendOutline, IoTrashOutline } from 'react-icons/io5';
import { HiOutlinePlus } from 'react-icons/hi';
import { FolderTree } from '../features/documents/components/FolderTree';
import { useTrash } from '../features/documents/hooks/useTrash';
import { usePendingDocuments } from '../features/documents/hooks/usePendingDocuments';
import { usePendingCount } from '../features/documents/hooks/usePendingCount';
import { useRestoreDocument } from '../features/documents/hooks/useRestoreDocument';
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
import { useApproveDocument } from '../features/documents/hooks/useApproveDocument';
import { RestoreDocumentModal } from '../features/documents/components/RestoreDocumentModal';
import { DeletePermanentlyDialog } from '../features/documents/components/DeletePermanentlyDialog';
import { useDocumentFile } from '../features/documents/hooks/useDocumentFile';
import { showError, showSuccess } from '../features/documents/utils/toasts';
import { pluralizePl, type PluralForms } from '../lib/pluralizePl';
import { ShareModal } from '../features/documents/components/ShareModal';
import { MoveFolderModal } from '../features/documents/components/MoveFolderModal';
import { useCreateFolderTemplate } from '../features/documents/hooks/useCreateFolderTemplate';
import { useSubmitForApproval } from '../features/documents/hooks/useSubmitForApproval';
import { useRevertApproval } from '../features/documents/hooks/useRevertApproval';
import { useWithdrawToDraft } from '../features/documents/hooks/useWithdrawToDraft';
import { useViewerManages } from '../features/projects/hooks/useViewerManages';
import { DocumentsToolbar } from '../features/documents/components/DocumentsToolbar';

const DOCUMENT_FORMS: PluralForms = ['dokument', 'dokumenty', 'dokumentów'];

function DocumentsView({ projectId }: { projectId: string }) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const {
    data: folders,
    isPending: foldersPending,
    isError: foldersFailed,
    refetch: refetchFolders,
  } = useFolders(projectId);
  const {
    data: documents,
    isPending: documentsPending,
    isError: documentsFailed,
  } = useDocuments(projectId, folderId);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>('document');
  const [uploadDocumentId, setUploadDocumentId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('');

  const [sortKey, setSortKey] = useState<'name' | 'updatedAt'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const sortBy = (key: 'name' | 'updatedAt') => {
    if (key === sortKey) {
      setSortAsc((wasAscending) => !wasAscending);
      return;
    }
    setSortKey(key);
    setSortAsc(key === 'name');
  };

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [signing, setSigning] = useState(false);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(
    null,
  );

  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);

  const [renameFolderId, setRenameFolderId] = useState<string | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string | null>(null);
  const [restoreDocumentId, setRestoreDocumentId] = useState<string | null>(
    null,
  );

  const [showTrash, setShowTrash] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(
    null,
  );

  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);

  const { data: trash } = useTrash(projectId);
  const { data: pending } = usePendingDocuments(projectId);
  const { data: pendingCount } = usePendingCount(projectId);

  const restoreVersionMutation = useRestoreVersion(projectId);
  const restoreDocument = useRestoreDocument(projectId);
  const createTemplate = useCreateFolderTemplate(projectId);

  const submitForApproval = useSubmitForApproval(projectId, folderId ?? '');

  const approveDocument = useApproveDocument(projectId, folderId ?? '');

  const revertApproval = useRevertApproval(projectId, folderId ?? '');

  const withdrawToDraft = useWithdrawToDraft(projectId, folderId ?? '');

  const canManage = useViewerManages(projectId);

  const [shareTarget, setShareTarget] = useState<{
    folderId?: string;
    documentId?: string;
  }>({});

  const shareFolder = (folderId: string) => setShareTarget({ folderId });
  const shareDocument = (documentId: string) => setShareTarget({ documentId });

  const { download, preview } = useDocumentFile(projectId);

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
    if (approveDocument.isPending) {
      return;
    }
    approveDocument.mutate(documentId, {
      onSuccess: () => showSuccess('Dokument zatwierdzony'),
      onError: showError,
    });
  };

  const withdraw = (documentId: string) => {
    if (withdrawToDraft.isPending) {
      return;
    }
    withdrawToDraft.mutate(documentId, {
      onSuccess: () => showSuccess('Wycofano do roboczych'),
      onError: showError,
    });
  };

  const revertApprovalOf = (documentId: string) => {
    if (revertApproval.isPending) {
      return;
    }
    revertApproval.mutate(documentId, {
      onSuccess: () => showSuccess('Cofnięto akceptację'),
      onError: showError,
    });
  };

  const sendForApproval = (documentId: string) => {
    if (submitForApproval.isPending) {
      return;
    }
    submitForApproval.mutate(documentId, {
      onSuccess: () =>
        showSuccess(
          canManage ? 'Dokument zatwierdzony' : 'Przekazano do akceptacji',
        ),
      onError: showError,
    });
  };

  const restore = (documentId: string, folderId?: string) => {
    if (restoreDocument.isPending) {
      return;
    }

    if (!folderId) {
      const doc = trash?.find((el) => el.id === documentId);
      if (doc?.folder?.deletedAt) {
        setRestoreDocumentId(documentId); // brak folderu → zapytaj i wyjdź
        return;
      }
    }

    restoreDocument.mutate(
      { documentId, folderId },
      {
        onSuccess: () => {
          showSuccess('Dokument przywrócony');
          setRestoreDocumentId(null);
        },
        onError: showError,
      },
    );
  };

  const selectFolder = (folderId: string) => {
    setFolderId(folderId);
    setShowTrash(false);
    setShowPending(false);
    setQuery('');
    setKindFilter('');
  };

  const openTrash = () => {
    setShowTrash(true);
    setShowPending(false);
  };

  const openPending = () => {
    setShowPending(true);
    setShowTrash(false);
  };

  const deleteFolderName = folders?.find(
    (el) => el.id === deleteFolderId,
  )?.name;

  const shareFolderName = folders?.find(
    (el) => el.id === shareTarget.folderId,
  )?.name;

  const shareDocumentName = documents?.find(
    (el) => el.id === shareTarget.documentId,
  )?.name;

  const shareTargetName = shareFolderName ?? shareDocumentName;

  const renameDocumentName =
    documents?.find((el) => el.id === renameDocumentId)?.name ?? '';

  const renameFolderName =
    folders?.find((el) => el.id === renameFolderId)?.name ?? '';

  const openNewFolder = (parentId: string | null) => {
    setNewFolderParentId(parentId);
    setShowNewFolder(true);
  };
  const buildTemplate = () => {
    createTemplate.mutate(undefined, {
      onSuccess: () => showSuccess('Utworzono standardowe foldery'),
      onError: showError,
    });
  };

  const deleteDocumentName = documents?.find(
    (el) => el.id === deleteDocumentId,
  )?.name;

  const toggleCollapsed = (folderId: string) => {
    if (collapsedIds.includes(folderId)) {
      setCollapsedIds(collapsedIds.filter((el) => el !== folderId));
    } else {
      setCollapsedIds([...collapsedIds, folderId]);
    }
  };

  const toggleExpanded = (documentId: string) => {
    if (expandedIds.includes(documentId)) {
      const newExpandsIds = expandedIds.filter((el) => el !== documentId);
      setExpandedIds(newExpandsIds);
    } else {
      setExpandedIds([...expandedIds, documentId]);
    }
  };

  const openUpload = () => {
    setUploadMode('document');
    setUploadDocumentId(null);
    setSigning(false);
    setShowUpload(true);
  };

  const openNewVersion = (documentId: string) => {
    setUploadMode('version');
    setUploadDocumentId(documentId);
    setSigning(false);
    setShowUpload(true);
  };

  const openSigning = (documentId: string) => {
    setUploadMode('version');
    setUploadDocumentId(documentId);
    setSigning(true);
    setShowUpload(true);
  };

  if (foldersPending) {
    return (
      <p className="px-4 py-10 text-center text-xs text-gray-400">
        Ładowanie...
      </p>
    );
  }
  if (foldersFailed || !folders) {
    return (
      <PageMessage
        message="Nie udało się wczytać folderów projektu."
        onRetry={() => void refetchFolders()}
      />
    );
  }

  const needle = query.trim().toLowerCase();

  const sourceDocuments = showPending ? pending : documents;

  const visibleDocuments = sourceDocuments
    ?.filter((doc) => {
      const matchesName = doc.name.toLowerCase().includes(needle);
      const matchesKind = kindFilter === '' || doc.kind === kindFilter;
      return matchesName && matchesKind;
    })
    .sort((a, b) => {
      const result =
        sortKey === 'name'
          ? a.name.localeCompare(b.name, 'pl')
          : a.updatedAt.localeCompare(b.updatedAt);
      return sortAsc ? result : -result;
    });

  const openFolder = folders.find((el) => el.id === folderId);
  const nameFolder = openFolder?.name;
  const canEditFolder = openFolder?.accessLevel === 'EDIT';
  const permanentDeleteName = trash?.find(
    (el) => el.id === permanentDeleteId,
  )?.name;

  const bytes =
    visibleDocuments?.reduce(
      (accumulator, currentValue) =>
        accumulator + (currentValue.versions[0]?.sizeBytes ?? 0),
      0,
    ) ?? 0;
  const parentFolderName = folders.find(
    (el) => el.id === newFolderParentId,
  )?.name;
  const closeDeletedFolder = (id: string) => {
    if (id === folderId) {
      setFolderId(null);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 pb-4 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <div className="flex items-start justify-between">
        <h1 className="text-base font-bold text-dark min-[500px]:text-xl lg:text-2xl">
          Dokumenty
        </h1>
        <Button
          variant="primary"
          size="small"
          onClick={openUpload}
          disabled={!folderId || showTrash || !canEditFolder}
          className="shrink-0 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
        >
          <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
          Wgraj plik
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="rounded-lg border border-gray-200 bg-white p-4 lg:w-72 lg:shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Foldery
            </p>
            {canManage && (
              <button
                type="button"
                onClick={() => openNewFolder(null)}
                className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
              >
                + Nowy folder
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <FolderTree
              folders={folders}
              collapsedIds={collapsedIds}
              onToggleCollapsed={toggleCollapsed}
              parentId={null}
              level={0}
              selectedId={showTrash || showPending ? null : folderId}
              onSelect={selectFolder}
              onAddSubfolder={openNewFolder}
              onDeleteFolder={setDeleteFolderId}
              onRename={setRenameFolderId}
              onMove={setMoveFolderId}
              onShare={shareFolder}
              canManage={canManage}
            />
            {canManage && folders.length === 0 && (
              <button
                type="button"
                onClick={buildTemplate}
                disabled={createTemplate.isPending}
                className="cursor-pointer rounded border border-dashed border-gray-300 px-3 py-3 text-xs text-gray-500 hover:border-darkGreen hover:text-darkGreen"
              >
                Utwórz standardowe foldery
              </button>
            )}
          </div>
          <div className="my-2 border-t border-gray-200" />
          <button
            type="button"
            onClick={openPending}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${showPending ? 'bg-lightGreen text-darkGreen' : 'text-dark hover:bg-gray-50'}`}
          >
            <IoSendOutline className="h-4 w-4 shrink-0" />
            <span className="flex-1">Do akceptacji</span>
            {pendingCount && pendingCount.count > 0 && (
              <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                {pendingCount.count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={openTrash}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${showTrash ? 'bg-lightGreen text-darkGreen' : 'text-dark hover:bg-gray-50'}`}
          >
            <IoTrashOutline className="h-4 w-4 shrink-0" />
            Kosz
          </button>
        </aside>
        <section className="flex-1 rounded-lg border border-gray-200 bg-white max-sm:border-0 max-sm:bg-transparent">
          {showTrash && (
            <div className="border-b border-gray-200 px-4 py-4 max-sm:border-0 max-sm:px-0">
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
              onDownload={download}
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
              onShare={shareDocument}
              onSubmitForApproval={sendForApproval}
              onMarkSigned={openSigning}
              onRevertApproval={revertApprovalOf}
              onWithdrawToDraft={withdraw}
            />
          )}
          {!showTrash && !showPending && !folderId && (
            <p className="px-4 py-10 text-center text-xs text-gray-400">
              Wybierz folder
            </p>
          )}

          {!showTrash && (folderId || showPending) && (
            <div className="border-b border-gray-200 px-4 py-4 max-sm:border-0 max-sm:px-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-dark">
                    {showPending ? 'Do akceptacji' : nameFolder}
                  </p>
                  {visibleDocuments && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      {pluralizePl(visibleDocuments.length, DOCUMENT_FORMS)}
                      {showPending ? '' : ` · ${formatFileSize(bytes)}`}
                    </p>
                  )}
                </div>

                <DocumentsToolbar
                  query={query}
                  onQueryChange={setQuery}
                  kind={kindFilter}
                  onKindChange={setKindFilter}
                />
              </div>
            </div>
          )}

          {folderId && documentsPending && !showTrash && !showPending && (
            <p className="px-4 py-10 text-center text-xs text-gray-400">
              Ładowanie...
            </p>
          )}
          {folderId && documentsFailed && !showTrash && !showPending && (
            <p className="px-4 py-10 text-center text-xs text-darkRed">
              Nie udało się wczytać dokumentów z tego folderu.
            </p>
          )}
          {visibleDocuments && !showTrash && (
            <DocumentsTable
              documents={visibleDocuments}
              projectId={projectId}
              sortKey={sortKey}
              sortAsc={sortAsc}
              onSort={sortBy}
              onDownload={download}
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
              onShare={shareDocument}
              onSubmitForApproval={sendForApproval}
              onMarkSigned={openSigning}
              onRevertApproval={revertApprovalOf}
              onWithdrawToDraft={withdraw}
            />
          )}
        </section>
      </div>
      <RestoreDocumentModal
        key={restoreDocumentId ?? 'closed'}
        documentId={restoreDocumentId}
        folders={folders}
        isPending={restoreDocument.isPending}
        onSubmit={(folderId) => restore(restoreDocumentId!, folderId)}
        onClose={() => setRestoreDocumentId(null)}
      />

      <RenameFolderModal
        projectId={projectId}
        folderId={renameFolderId}
        currentName={renameFolderName}
        onClose={() => setRenameFolderId(null)}
      />

      <UploadDocumentModal
        key={
          showUpload
            ? `${uploadMode}-${uploadDocumentId ?? 'new'}-${signing}`
            : 'closed'
        }

        isOpen={showUpload}
        projectId={projectId}
        folderId={folderId ?? ''}
        folderName={nameFolder}
        documents={documents ?? []}
        initialMode={uploadMode}
        initialDocumentId={uploadDocumentId}
        onClose={() => setShowUpload(false)}
        canManage={canManage}
        signing={signing}
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
        onDeleted={closeDeletedFolder}
      />

      <DeleteDocumentDialog
        projectId={projectId}
        folderId={folderId ?? ''}
        documentId={deleteDocumentId}
        documentName={deleteDocumentName}
        onClose={() => setDeleteDocumentId(null)}
      />

      <DeletePermanentlyDialog
        projectId={projectId}
        documentId={permanentDeleteId}
        documentName={permanentDeleteName}
        onClose={() => setPermanentDeleteId(null)}
      />
      <MoveFolderModal
        key={moveFolderId ?? 'closed'}
        projectId={projectId}
        folderId={moveFolderId}
        folders={folders}
        onClose={() => setMoveFolderId(null)}
      />

      <ShareModal
        projectId={projectId}
        target={shareTarget}
        targetName={shareTargetName}
        onClose={() => setShareTarget({})}
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
