import type { BackendDocument } from '../../../lib/api';
import { DocumentRow } from './DocumentRow';


interface Props {
  projectId: string;
  documents: BackendDocument[];
  onDownload: (documentId: string, versionNo: number, fileName: string) => void;
  expandedIds: string[];
  onToggle: (documentId: string) => void;
  onNewVersion: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  variant: 'folder' | 'trash';
  onRestoreDocument: (documentId: string) => void;
  onDeletePermanently: (documentId: string) => void;
}

const HEAD_CLASS =
  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400';

export function DocumentsTable({
  projectId,
  documents,
  onDownload,
  expandedIds,
  onToggle,
  onNewVersion,
  onDeleteDocument,
  variant,
  onRestoreDocument,
  onDeletePermanently,
}: Props) {
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
            <th className={HEAD_CLASS}></th>

            <th className={HEAD_CLASS}>Nazwa dokumentu</th>
            <th className={HEAD_CLASS}>Rodzaj</th>
            <th className={HEAD_CLASS}>Zmieniono</th>
            <th className={HEAD_CLASS}>Wersja</th>
            <th className={HEAD_CLASS}>Status</th>
            <th className={HEAD_CLASS}></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <DocumentRow
              key={doc.id}
              document={doc}
              projectId={projectId}
              isExpanded={expandedIds.includes(doc.id)}
              onToggle={onToggle}
              onDownload={onDownload}
              onNewVersion={onNewVersion}
              onDeleteDocument={onDeleteDocument}
              variant={variant}
              onRestoreDocument={onRestoreDocument}
              onDeletePermanently = {onDeletePermanently}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
