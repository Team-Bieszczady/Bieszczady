import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import type { BackendDocument } from '../../../lib/api';
import { DocumentCard } from './DocumentCard';
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
  onRenameDocument: (documentId: string) => void;
  onPreview: (documentId: string, versionNo: number) => void;
  onRestoreVersion: (documentId: string, versionNo: number) => void;
  onSubmitForApproval: (documentId: string) => void;
  onMarkSigned: (documentId: string) => void;
  onRevertApproval: (documentId: string) => void;
  onWithdrawToDraft: (documentId: string) => void;
  onApprove: (documentId: string) => void;
  onShare: (documentId: string) => void;
  sortKey?: 'name' | 'updatedAt';
  sortAsc?: boolean;
  onSort?: (key: 'name' | 'updatedAt') => void;
}

const HEAD_CLASS =
  'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400';

// Krótkie kolumny zwężają się do treści, a całą wolną przestrzeń
// zabiera kolumna z nazwą — to ona jej potrzebuje.
const HEAD_SHRINK = `${HEAD_CLASS} w-px whitespace-nowrap`;

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
  onRenameDocument,
  onPreview,
  onRestoreVersion,
  onApprove,
  onShare,
  onSubmitForApproval,
  onMarkSigned,
  onRevertApproval,
  onWithdrawToDraft,
  sortKey,
  sortAsc,
  onSort,
}: Props) {
  const sortableHead = (key: 'name' | 'updatedAt', label: string) => {
    const headClass = key === 'name' ? HEAD_CLASS : HEAD_SHRINK;

    if (!onSort) {
      return <th className={headClass}>{label}</th>;
    }

    return (
      <th className={headClass}>
        <button
          type="button"
          onClick={() => onSort(key)}
          title={`Sortuj po: ${label.toLowerCase()}`}
          className={`group flex cursor-pointer items-center gap-1 whitespace-nowrap uppercase transition-colors hover:text-dark ${
            sortKey === key ? 'text-dark' : ''
          }`}
        >
          {label}
          {sortKey === key ? (
            sortAsc ? (
              <IoChevronUp className="h-3 w-3" />
            ) : (
              <IoChevronDown className="h-3 w-3" />
            )
          ) : (
            // Blada strzałka pod kursorem mówi „w to da się kliknąć".
            <IoChevronDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-50" />
          )}
        </button>
      </th>
    );
  };

  if (documents.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-xs text-gray-400">
        {variant === 'trash' ? 'Kosz jest pusty' : 'Ten folder jest pusty'}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className={HEAD_CLASS}></th>
              {sortableHead('name', 'Nazwa dokumentu')}
              <th className={HEAD_SHRINK}>Rodzaj</th>
              {sortableHead('updatedAt', 'Zmieniono')}
              <th className={HEAD_SHRINK}>Wersja</th>
              <th className={HEAD_SHRINK}>Status</th>
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
                onDeletePermanently={onDeletePermanently}
                onRenameDocument={onRenameDocument}
                onPreview={onPreview}
                onRestoreVersion={onRestoreVersion}
                onApprove={onApprove}
                onShare={onShare}
                onSubmitForApproval={onSubmitForApproval}
                onMarkSigned={onMarkSigned}
                onRevertApproval={onRevertApproval}
                onWithdrawToDraft={onWithdrawToDraft}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {documents.map((doc) => (
          <DocumentCard
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
            onDeletePermanently={onDeletePermanently}
            onRenameDocument={onRenameDocument}
            onPreview={onPreview}
            onRestoreVersion={onRestoreVersion}
            onApprove={onApprove}
            onShare={onShare}
            onSubmitForApproval={onSubmitForApproval}
            onMarkSigned={onMarkSigned}
            onRevertApproval={onRevertApproval}
            onWithdrawToDraft={onWithdrawToDraft}
          />
        ))}
      </div>
    </>
  );
}
