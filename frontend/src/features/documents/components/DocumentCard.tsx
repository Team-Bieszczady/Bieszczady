import type { BackendDocument } from '../../../lib/api';
import {
  DOCUMENT_KIND_LABELS,
  DOCUMENT_STATUS_CLASSES,
  DOCUMENT_STATUS_LABELS,
} from '../../../lib/documents';
import {
  canPreview,
  fileExtension,
  formatDate,
  formatFileSize,
} from '../utils/formatters';
import { VersionHistory } from './VersionHistory';
import { documentMenuItems } from '../utils/documentMenuItems';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { useAuth } from '../../../context/useAuth';
import { useViewerManages } from '../../projects/hooks/useViewerManages';
import { IoChevronDown, IoChevronForward } from 'react-icons/io5';

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
  onSubmitForApproval: (documentId: string) => void;
  onMarkSigned: (documentId: string) => void;
  onRevertApproval: (documentId: string) => void;
  onWithdrawToDraft: (documentId: string) => void;
}

export const DocumentCard = ({
  document,
  projectId,
  isExpanded,
  onToggle,
  onRestoreVersion,
  variant,
  onDownload,
  onNewVersion,
  onDeleteDocument,
  onRestoreDocument,
  onDeletePermanently,
  onRenameDocument,
  onPreview,
  onApprove,
  onShare,
  onSubmitForApproval,
  onMarkSigned,
  onRevertApproval,
  onWithdrawToDraft,
}: Props) => {
  const version = document.versions[0];
  const { user } = useAuth();

  const isLocked =
    document.status === 'APPROVED' || document.status === 'SIGNED';
  const canDelete = !isLocked || Boolean(user?.isDirector);
  const canManage = useViewerManages(projectId);
  const canEdit = document.accessLevel === 'EDIT';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-dark">
            {document.name}
          </p>
          {version && (
            <p className="mt-0.5 text-xs text-gray-400">
              {fileExtension(version.fileName)} ·{' '}
              {formatFileSize(version.sizeBytes)} · v{version.versionNo} ·{' '}
              {version.uploadedBy.firstName} {version.uploadedBy.lastName}
              {document.folder?.name ? ` · ${document.folder.name}` : ''}
            </p>
          )}
        </div>

        <ActionMenu
          ariaLabel={`Akcje dokumentu ${document.name}`}
          items={documentMenuItems(
            document,
            variant,
            {
              canDelete,
              canManage,
              canEdit,
              isDirector: Boolean(user?.isDirector),
            },
            {
              onNewVersion,
              onRenameDocument,
              onShare,
              onApprove,
              onDeleteDocument,
              onRestoreDocument,
              onDeletePermanently,
              onSubmitForApproval,
              onMarkSigned,
              onRevertApproval,
              onWithdrawToDraft,
            },
          )}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {DOCUMENT_KIND_LABELS[document.kind]}
          </span>
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${DOCUMENT_STATUS_CLASSES[document.status]}`}
          >
            {DOCUMENT_STATUS_LABELS[document.status]}
          </span>
        </div>
        <span className="shrink-0 text-xs text-gray-400">
          {formatDate(document.updatedAt)}
        </span>
      </div>

      {version && (
        <div className="mt-3 flex gap-4 border-t border-gray-200 pt-3">
          <button
            type="button"
            onClick={() =>
              onDownload(document.id, version.versionNo, version.fileName)
            }
            className="cursor-pointer text-xs font-medium text-darkGreen"
          >
            Pobierz
          </button>
          {canPreview(version.mimeType) && (
            <button
              type="button"
              onClick={() => onPreview(document.id, version.versionNo)}
              className="cursor-pointer text-xs font-medium text-darkGreen"
            >
              Podgląd
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggle(document.id)}
            className="ml-auto flex cursor-pointer items-center gap-1 text-xs font-medium text-darkGreen"
          >
            {isExpanded ? (
              <IoChevronDown className="h-3.5 w-3.5" />
            ) : (
              <IoChevronForward className="h-3.5 w-3.5" />
            )}
            Historia
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <VersionHistory
            projectId={projectId}
            documentId={document.id}
            variant={variant}
            canEdit={canEdit}
            onNewVersion={onNewVersion}
            onDownload={onDownload}
            onPreview={onPreview}
            onRestoreVersion={onRestoreVersion}
          />
        </div>
      )}
    </div>
  );
};
