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
import { IoChevronDown, IoChevronForward } from 'react-icons/io5';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { useAuth } from '../../../context/useAuth';
import { documentMenuItems } from '../utils/documentMenuItems';
import { useViewerManages } from '../../projects/hooks/useViewerManages';
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
            <p className="mt-0.5 text-xs whitespace-nowrap text-gray-400">
              {fileExtension(version.fileName)} ·{' '}
              {formatFileSize(version.sizeBytes)} ·{' '}
              {version.uploadedBy.firstName} {version.uploadedBy.lastName}
              {document.folder?.name ? ` · ${document.folder.name}` : ''}
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
            <div className="flex w-32 justify-end gap-4">
              {version && canPreview(version.mimeType) && (
                <button
                  type="button"
                  className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
                  onClick={() => onPreview(document.id, version.versionNo)}
                >
                  Podgląd
                </button>
              )}
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
            </div>
            <div className="w-7 shrink-0">
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
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-gray-200 bg-gray-50">
          <td colSpan={7} className="px-4 py-4">
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
          </td>
        </tr>
      )}
    </>
  );
};
