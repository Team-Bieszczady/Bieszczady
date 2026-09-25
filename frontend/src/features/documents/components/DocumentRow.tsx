import { useVersions } from '../hooks/useVersions';
import type { BackendDocument } from '../../../lib/api';
import {
  DOCUMENT_KIND_LABELS,
  DOCUMENT_STATUS_CLASSES,
  DOCUMENT_STATUS_LABELS,
} from '../../../lib/documents';
import { fileExtension, formatDate, formatFileSize } from '../utils/formatters';
import {
  IoArrowUndoOutline,
  IoCheckmarkOutline,
  IoChevronDown,
  IoChevronForward,
  IoCreateOutline,
  IoPersonAddOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import { ActionMenu } from '../../../components/ui/ActionMenu';
interface Props {
  document: BackendDocument;
  projectId: string;
  isExpanded: boolean;
  onToggle: (documentId: string) => void;
  onDownload: (documentId: string, versionNo: number, fileName: string) => void;
  onNewVersion: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  variant: 'folder' | 'trash';
  onRestoreDocument: (documentId: string) => void;
  onDeletePermanently: (documentId: string) => void;
  onRenameDocument: (documentId: string) => void;
  onPreview: (documentId: string, versionNo: number) => void;
  onRestoreVersion: (documentId: string, versionNo: number) => void;
  onApprove: (documentId: string) => void;
  onShare: (documentId: string) => void;
}

const canPreview = (mimeType: string) => {
  return mimeType === 'application/pdf' || mimeType.startsWith('image/');
};

export const DocumentRow = ({
  document,
  projectId,
  isExpanded,
  onToggle,
  onDownload,
  onNewVersion,
  onDeleteDocument,
  variant,
  onRestoreDocument,
  onDeletePermanently,
  onRenameDocument,
  onPreview,
  onRestoreVersion,
  onApprove,
  onShare
}: Props) => {
  const version = document.versions[0];
  const {
    data: versions,
    error,
    isPending,
  } = useVersions(projectId, isExpanded ? document.id : null);

  return (
    <>
      <tr
        key={document.id}
        className="border-b border-gray-200 last:border-0 hover:bg-gray-50"
      >
        <td className="pl-4">
          <button
            type="button"
            onClick={() => onToggle(document.id)}
            className="cursor-pointer"
          >
            {isExpanded ? (
              <IoChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <IoChevronForward className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-dark">{document.name}</p>
          {version && (
            <p className="mt-0.5 text-xs text-gray-400">
              {fileExtension(version.fileName)} ·{' '}
              {formatFileSize(version.sizeBytes)}
            </p>
          )}
        </td>

        <td className="px-4 py-3 text-xs text-gray-600">
          {DOCUMENT_KIND_LABELS[document.kind]}
        </td>

        <td className="px-4 py-3 text-xs text-gray-600">
          {formatDate(document.updatedAt)}
        </td>

        <td className="px-4 py-3 text-xs text-darkGreen">
          {version ? `v${version.versionNo}` : '-'}
        </td>

        <td className="px-4 py-3">
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${DOCUMENT_STATUS_CLASSES[document.status]}`}
          >
            {DOCUMENT_STATUS_LABELS[document.status]}
          </span>
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <div className="flex gap-4">
              {version && (
                <button
                  type="button"
                  onClick={() =>
                    onDownload(document.id, version.versionNo, version.fileName)
                  }
                  className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
                >
                  Pobierz
                </button>
              )}
              {version && canPreview(version.mimeType) && (
                <button
                  className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
                  onClick={() => onPreview(document.id, version.versionNo)}
                >
                  Podgląd
                </button>
              )}
            </div>
            {variant === 'folder' && (
              <ActionMenu
                ariaLabel={`Akcje dokumentu ${document.name}`}
                items={[
                  {
                    id: 'delete-document',
                    label: 'Usuń',
                    icon: <IoTrashOutline className="h-4 w-4" />,
                    tone: 'danger',
                    onSelect: () => onDeleteDocument(document.id),
                  },
                  {
                    id: 'rename-document',
                    label: 'Zmień nazwę',
                    icon: <IoCreateOutline className="h-4 w-4" />,
                    onSelect: () => onRenameDocument(document.id),
                  },
                  {
  id: 'share-document',
  label: 'Udostępnij',
  icon: <IoPersonAddOutline className="h-4 w-4" />,
  onSelect: () => onShare(document.id),
},


                  ...(document.status === 'PENDING_APPROVAL'
                    ? [
                        {
                          id: 'approve-document',
                          label: 'Akceptuj',
                          icon: <IoCheckmarkOutline className="h-4 w-4" />,
                          onSelect: () => onApprove(document.id),
                        },
                      ]
                    : []),
                ]}
              />
            )}
            {variant === 'trash' && (
              <ActionMenu
                ariaLabel={`Akcje dokumentu ${document.name}`}
                items={[
                  {
                    id: 'restore-document',
                    label: 'Przywróć',
                    icon: <IoArrowUndoOutline className="h-4 w-4" />,
                    onSelect: () => onRestoreDocument(document.id),
                  },
                  {
                    id: 'delete-permanently',
                    label: 'Usuń trwale',
                    icon: <IoTrashOutline className="h-4 w-4" />,
                    tone: 'danger',
                    onSelect: () => onDeletePermanently(document.id),
                  },
                ]}
              />
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-gray-200 bg-gray-50">
          <td colSpan={7} className="px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Historia wersji
            </p>
            {variant === 'folder' && (
              <button
                type="button"
                onClick={() => onNewVersion(document.id)}
                className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
              >
                Wgraj nową wersję
              </button>
            )}

            {error && (
              <p className="text-xs text-red-600">
                Nie udało się wczytać historii wersji
              </p>
            )}
            {isPending && (
              <p className="text-xs text-gray-400">Ładowanie historii...</p>
            )}
            <div className="flex flex-col gap-4">
              {versions &&
                versions.map((wersja, index) => (
                  <div key={wersja.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-dark">
                        v{wersja.versionNo}
                      </span>
                      {index === 0 && (
                        <span className="rounded-full bg-lightGreen px-2 py-0.5 text-xs font-medium text-darkGreen">
                          AKTUALNA
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-dark">
                      {wersja.changeNote ?? 'Utworzenie dokumentu'}
                    </p>

                    <p className="text-xs text-gray-400">
                      {wersja.uploadedBy.firstName} {wersja.uploadedBy.lastName}{' '}
                      · {formatDate(wersja.createdAt)} ·{' '}
                      {formatFileSize(wersja.sizeBytes)}
                    </p>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          onDownload(
                            document.id,
                            wersja.versionNo,
                            wersja.fileName,
                          );
                        }}
                        className="w-fit cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
                      >
                        Pobierz
                      </button>
                      {canPreview(wersja.mimeType) && (
                        <button
                          className="w-fit cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
                          onClick={() =>
                            onPreview(document.id, wersja.versionNo)
                          }
                        >
                          Podgląd
                        </button>
                      )}
                      {variant === 'folder' &&
                        wersja.storageKey !== versions[0]?.storageKey && (
                          <button
                            type="button"
                            onClick={() =>
                              onRestoreVersion(document.id, wersja.versionNo)
                            }
                            className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
                          >
                            Przywróć jako v{(versions[0]?.versionNo ?? 0) + 1}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
