import type { BackendDocument } from '../../../lib/api';
import {
  DOCUMENT_KIND_LABELS,
  DOCUMENT_STATUS_CLASSES,
  DOCUMENT_STATUS_LABELS,
} from '../../../lib/documents';
import { fileExtension, formatDate, formatFileSize } from '../utils/formatters';

interface Props {
  documents: BackendDocument[];
  onDownload: (documentId: string, versionNo: number, fileName: string) => void;
}

const HEAD_CLASS =
  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400';

export function DocumentsTable({ documents, onDownload }: Props) {
  if (documents.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-xs text-gray-400">
        Ten folder jest pusty
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className={HEAD_CLASS}>Nazwa dokumentu</th>
            <th className={HEAD_CLASS}>Rodzaj</th>
            <th className={HEAD_CLASS}>Zmieniono</th>
            <th className={HEAD_CLASS}>Wersja</th>
            <th className={HEAD_CLASS}>Status</th>
            <th className={HEAD_CLASS}></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => {
            const version = document.versions[0];
            return (
              <tr
                key={document.id}
                className="border-b border-gray-200 last:border-0 hover:bg-gray-50"
              >
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
                    className={`rounded-full px-2 py-0.5 text-xs ${DOCUMENT_STATUS_CLASSES[document.status]}`}
                  >
                    {DOCUMENT_STATUS_LABELS[document.status]}
                  </span>
                </td>

                <td className="px-4 py-3 text-right">
                  {version && (
                    <button
                      type="button"
                      onClick={() =>
                        onDownload(
                          document.id,
                          version.versionNo,
                          version.fileName,
                        )
                      }
                      className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
                    >
                      Pobierz
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
