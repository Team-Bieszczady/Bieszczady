import { InlineQueryState } from '../../../components/ui/InlineQueryState';
import { useVersions } from '../hooks/useVersions';
import { canPreview, formatDate, formatFileSize } from '../utils/formatters';

interface Props {
  projectId: string;
  documentId: string;
  variant: 'folder' | 'trash';
  canEdit: boolean;
  onNewVersion: (documentId: string) => void;
  onDownload: (documentId: string, versionNo: number, fileName: string) => void;
  onPreview: (documentId: string, versionNo: number) => void;
  onRestoreVersion: (documentId: string, versionNo: number) => void;
}

const LINK_CLASSES =
  'cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover';

export function VersionHistory({
  projectId,
  documentId,
  variant,
  canEdit,
  onNewVersion,
  onDownload,
  onPreview,
  onRestoreVersion,
}: Props) {
  const { data, isPending, isError, isFetching, refetch } = useVersions(
    projectId,
    documentId,
  );

  return (
    <>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Historia wersji
      </p>
      {variant === 'folder' && canEdit && (
        <button
          type="button"
          onClick={() => onNewVersion(documentId)}
          className={`mb-3 ${LINK_CLASSES}`}
        >
          Wgraj nową wersję
        </button>
      )}

      <InlineQueryState
        compact
        isLoading={isPending}
        isError={isError}
        isFetching={isFetching}
        data={data}
        loadingMessage="Ładowanie historii..."
        errorMessage="Nie udało się wczytać historii wersji."
        onRetry={() => void refetch()}
      >
        {(versions) => (
          <div className="flex flex-col gap-4">
            {versions.map((wersja, index) => (
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
                  {wersja.uploadedBy.firstName} {wersja.uploadedBy.lastName} ·{' '}
                  {formatDate(wersja.createdAt)} ·{' '}
                  {formatFileSize(wersja.sizeBytes)}
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      onDownload(documentId, wersja.versionNo, wersja.fileName)
                    }
                    className={LINK_CLASSES}
                  >
                    Pobierz
                  </button>
                  {canPreview(wersja.mimeType) && (
                    <button
                      type="button"
                      onClick={() => onPreview(documentId, wersja.versionNo)}
                      className={LINK_CLASSES}
                    >
                      Podgląd
                    </button>
                  )}
                  {variant === 'folder' &&
                    canEdit &&
                    wersja.storageKey !== versions[0]?.storageKey && (
                      <button
                        type="button"
                        onClick={() =>
                          onRestoreVersion(documentId, wersja.versionNo)
                        }
                        className={LINK_CLASSES}
                      >
                        Przywróć jako v{(versions[0]?.versionNo ?? 0) + 1}
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </InlineQueryState>
    </>
  );
}
