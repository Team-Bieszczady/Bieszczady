import { useRef, useState } from 'react';
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
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageLoading } from '../components/ui/PageLoading';
import { InlineQueryState } from '../components/ui/InlineQueryState';
import { useApproveDocument } from '../features/documents/hooks/useApproveDocument';
import { RestoreDocumentModal } from '../features/documents/components/RestoreDocumentModal';
import { DeletePermanentlyDialog } from '../features/documents/components/DeletePermanentlyDialog';
import { useDocumentFile } from '../features/documents/hooks/useDocumentFile';
import { showError, showSuccess } from '../features/documents/utils/toasts';
import { pluralizePl, type PluralForms } from '../lib/pluralizePl';
import { ShareModal } from '../features/documents/components/ShareModal';
import { MoveFolderModal } from '../features/documents/components/MoveFolderModal';
import { AccessChangeNotice } from '../features/documents/components/AccessChangeNotice';
import { useCreateFolderTemplate } from '../features/documents/hooks/useCreateFolderTemplate';
import { useSubmitForApproval } from '../features/documents/hooks/useSubmitForApproval';
import { useRevertApproval } from '../features/documents/hooks/useRevertApproval';
import { useWithdrawToDraft } from '../features/documents/hooks/useWithdrawToDraft';
import { useViewerManages } from '../features/projects/hooks/useViewerManages';
import { DocumentsToolbar } from '../features/documents/components/DocumentsToolbar';
import { useMoveFolder } from '../features/documents/hooks/useMoveFolder';
import {
  accessChangeOnMove,
  collectAncestorIds,
} from '../features/documents/utils/folderTree';

const DOCUMENT_FORMS: PluralForms = ['dokument', 'dokumenty', 'dokumentów'];
const DELETED_DOCUMENT_FORMS: PluralForms = [
  'usunięty dokument',
  'usunięte dokumenty',
  'usuniętych dokumentów',
];

function DocumentsView({ projectId }: { projectId: string }) {
  const [folderId, setFolderId] = useState<string | null>(null);
  const {
    data: folders,
    isError: foldersFailed,
    refetch: refetchFolders,
  } = useFolders(projectId);
  const {
    data: documents,
    isPending: documentsPending,
    isError: documentsFailed,
    isFetching: documentsFetching,
    refetch: refetchDocuments,
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
  const [moveRequest, setMoveRequest] = useState<{
    folderId: string;
    parentId: string | null;
  } | null>(null);
  const checkingMove = useRef(false);
  const moving = useRef(false);
  const [restoreDocumentId, setRestoreDocumentId] = useState<string | null>(
    null,
  );

  const [showTrash, setShowTrash] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [uploadFolderId, setUploadFolderId] = useState<string | null>(null);

  const [permanentDeleteId, setPermanentDeleteId] = useState<string | null>(
    null,
  );

  const [renameDocumentId, setRenameDocumentId] = useState<string | null>(null);

  const {
    data: trash,
    isPending: trashPending,
    isError: trashFailed,
    isFetching: trashFetching,
    refetch: refetchTrash,
  } = useTrash(projectId);
  const {
    data: pending,
    isPending: pendingLoading,
    isError: pendingFailed,
    isFetching: pendingFetching,
    refetch: refetchPending,
  } = usePendingDocuments(projectId);
  const { data: pendingCount } = usePendingCount(projectId);

  const restoreVersionMutation = useRestoreVersion(projectId);
  const restoreDocument = useRestoreDocument(projectId);
  const createTemplate = useCreateFolderTemplate(projectId);
  const moveFolder = useMoveFolder(projectId);

  const submitForApproval = useSubmitForApproval(projectId);

  const approveDocument = useApproveDocument(projectId);

  const revertApproval = useRevertApproval(projectId);

  const withdrawToDraft = useWithdrawToDraft(projectId);

  const canManage = useViewerManages(projectId);

  const [shareTarget, setShareTarget] = useState<{
    folderId?: string;
    documentId?: string;
  }>({});

  const shareFolder = (folderId: string) => setShareTarget({ folderId });
  const shareDocument = (documentId: string) => setShareTarget({ documentId });

  const { download, preview } = useDocumentFile(projectId);

  const documentsInView = showPending ? pending : documents;
  const viewPending = showPending ? pendingLoading : documentsPending;
  const viewFailed = showPending ? pendingFailed : documentsFailed;
  const viewFetching = showPending ? pendingFetching : documentsFetching;
  const refetchView = showPending ? refetchPending : refetchDocuments;

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

  const startDraggingFolder = (folderId: string | null) => {
    setDraggedFolderId(folderId);
    if (folderId === null) {
      setDropTargetId(null);
      return;
    }
    void refetchFolders();
  };

  const openMoveFolder = (folderId: string) => {
    void refetchFolders().then(() => setMoveFolderId(folderId));
  };

  const revealFolder = (targetId: string | null) => {
    if (!targetId) {
      return;
    }
    const path = collectAncestorIds(folders ?? [], targetId);
    setCollapsedIds((ids) => ids.filter((id) => !path.has(id)));
  };

  const runMove = (folderId: string, parentId: string | null) => {
    if (moving.current) {
      return;
    }
    moving.current = true;
    moveFolder.mutate(
      { folderId, parentId },
      {
        onSuccess: () => {
          showSuccess('Folder przeniesiony');
          revealFolder(parentId);
          setMoveFolderId((current) => (current === folderId ? null : current));
          setMoveRequest((current) =>
            current?.folderId === folderId ? null : current,
          );
        },
        onError: showError,
        onSettled: () => {
          moving.current = false;
        },
      },
    );
  };

  const requestMove = async (folderId: string, parentId: string | null) => {
    if (moving.current || checkingMove.current) {
      return;
    }
    checkingMove.current = true;
    const fresh = await refetchFolders({ cancelRefetch: false });
    checkingMove.current = false;

    if (fresh.isError || !fresh.data) {
      showError(fresh.error ?? new Error('Nie udało się wczytać folderów'));
      return;
    }

    const change = accessChangeOnMove(fresh.data, folderId, parentId);
    if (change.gains.length === 0 && change.losses.length === 0) {
      runMove(folderId, parentId);
      return;
    }
    setMoveRequest({ folderId, parentId });
  };

  const dropFolderOn = (parentId: string | null) => {
    const draggedId = draggedFolderId;

    setDraggedFolderId(null);
    setDropTargetId(null);

    const dragged = folders?.find((el) => el.id === draggedId);

    if (
      moveFolder.isPending ||
      !draggedId ||
      draggedId === parentId ||
      dragged?.parentId === parentId
    ) {
      return;
    }

    void requestMove(draggedId, parentId);
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
    setQuery('');
    setKindFilter('');
  };

  const openPending = () => {
    setShowPending(true);
    setShowTrash(false);
    setQuery('');
    setKindFilter('');
  };

  const deleteFolderName = folders?.find(
    (el) => el.id === deleteFolderId,
  )?.name;

  const shareFolderName = folders?.find(
    (el) => el.id === shareTarget.folderId,
  )?.name;

  const shareDocumentName = documentsInView?.find(
    (el) => el.id === shareTarget.documentId,
  )?.name;

  const shareTargetName = shareFolderName ?? shareDocumentName;

  const renameDocumentName =
    documentsInView?.find((el) => el.id === renameDocumentId)?.name ?? '';

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

  const deleteDocumentName = documentsInView?.find(
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

  const folderOfDocument = (documentId: string) =>
    documentsInView?.find((el) => el.id === documentId)?.folderId ?? folderId;

  const openUpload = () => {
    setUploadMode('document');
    setUploadDocumentId(null);
    setUploadFolderId(folderId);
    setSigning(false);
    setShowUpload(true);
  };

  const openNewVersion = (documentId: string) => {
    setUploadMode('version');
    setUploadDocumentId(documentId);
    setUploadFolderId(folderOfDocument(documentId));
    setSigning(false);
    setShowUpload(true);
  };

  const openSigning = (documentId: string) => {
    setUploadMode('version');
    setUploadDocumentId(documentId);
    setUploadFolderId(folderOfDocument(documentId));
    setSigning(true);
    setShowUpload(true);
  };

  if (!folders) {
    if (foldersFailed) {
      return (
        <PageMessage
          message="Nie udało się wczytać folderów projektu."
          onRetry={() => void refetchFolders()}
        />
      );
    }
    return <PageLoading />;
  }

  const needle = query.trim().toLowerCase();

  const visibleDocuments = documentsInView
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
  const draggedFolder = folders.find((el) => el.id === draggedFolderId);
  const movingFolderName =
    folders.find((el) => el.id === moveRequest?.folderId)?.name ?? '';
  const pendingChange = moveRequest
    ? accessChangeOnMove(folders, moveRequest.folderId, moveRequest.parentId)
    : { gains: [], losses: [] };
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
          disabled={!folderId || showTrash || showPending || !canEditFolder}
          className="shrink-0 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
        >
          <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
          Wgraj plik
        </Button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto xl:w-80">
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
              onMove={openMoveFolder}
              onShare={shareFolder}
              canManage={canManage}
              draggedId={draggedFolderId}
              overId={dropTargetId}
              onDragFolder={startDraggingFolder}
              onDragOverFolder={setDropTargetId}
              onDropOnFolder={dropFolderOn}
            />
            {draggedFolder?.parentId && (
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  dropFolderOn(null);
                }}
                className="mt-2 rounded border border-dashed border-gray-300 px-3 py-3 text-center text-xs text-gray-400"
              >
                Upuść tutaj, aby przenieść na główny poziom
              </div>
            )}
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

              {trash && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {pluralizePl(trash.length, DELETED_DOCUMENT_FORMS)}
                </p>
              )}
            </div>
          )}
          {showTrash && (
            <InlineQueryState
              isLoading={trashPending}
              isError={trashFailed}
              isFetching={trashFetching}
              data={trash}
              errorMessage="Nie udało się wczytać kosza."
              onRetry={() => void refetchTrash()}
            >
              {(items) => (
                <DocumentsTable
                  documents={items}
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
            </InlineQueryState>
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
                  searchLabel={
                    showPending
                      ? 'Szukaj w tej liście'
                      : 'Szukaj w tym folderze'
                  }
                />
              </div>
            </div>
          )}

          {!showTrash && (folderId || showPending) && (
            <InlineQueryState
              isLoading={viewPending}
              isError={viewFailed}
              isFetching={viewFetching}
              data={visibleDocuments}
              errorMessage={
                showPending
                  ? 'Nie udało się wczytać dokumentów czekających na akceptację.'
                  : 'Nie udało się wczytać dokumentów z tego folderu.'
              }
              onRetry={() => void refetchView()}
            >
              {(items) => (
                <DocumentsTable
                  documents={items}
                  projectId={projectId}
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={sortBy}
                  emptyMessage={
                    needle || kindFilter
                      ? 'Nic nie pasuje do wyszukiwania'
                      : showPending
                        ? 'Nic nie czeka na akceptację'
                        : undefined
                  }
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
            </InlineQueryState>
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
        folderId={uploadFolderId ?? ''}
        folderName={folders.find((el) => el.id === uploadFolderId)?.name}
        documents={documentsInView ?? []}
        initialMode={uploadMode}
        initialDocumentId={uploadDocumentId}
        onClose={() => setShowUpload(false)}
        canManage={canManage}
        signing={signing}
      />

      <RenameDocumentModal
        projectId={projectId}
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
        folderId={moveFolderId}
        folders={folders}
        isPending={moveFolder.isPending}
        onSubmit={(parentId) => {
          if (moveFolderId) {
            runMove(moveFolderId, parentId);
          }
        }}
        onClose={() => setMoveFolderId(null)}
      />

      <ConfirmDialog
        isOpen={moveRequest !== null}
        onClose={() => setMoveRequest(null)}
        onConfirm={() => {
          if (moveRequest) {
            runMove(moveRequest.folderId, moveRequest.parentId);
          }
        }}
        title="Przenieść folder?"
        description={
          <AccessChangeNotice
            folders={folders}
            folderName={movingFolderName}
            gains={pendingChange.gains}
            losses={pendingChange.losses}
          />
        }
        confirmLabel="Przenieś"
        isPending={moveFolder.isPending}
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
