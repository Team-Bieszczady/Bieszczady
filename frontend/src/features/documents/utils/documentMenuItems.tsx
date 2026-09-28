import {
  IoArrowUndoOutline,
  IoCheckmarkOutline,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoPersonAddOutline,
  IoSendOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import type { BackendDocument } from '../../../lib/api';

interface Handlers {
  onNewVersion: (documentId: string) => void;
  onRenameDocument: (documentId: string) => void;
  onShare: (documentId: string) => void;
  onApprove: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onRestoreDocument: (documentId: string) => void;
  onDeletePermanently: (documentId: string) => void;
  onSubmitForApproval: (documentId: string) => void;
  onMarkSigned: (documentId: string) => void;
}

export function documentMenuItems(
  document: BackendDocument,
  variant: 'folder' | 'trash',
  flags: {
    canDelete: boolean;
    canManage: boolean;
    canEdit: boolean;
    isDirector: boolean;
  },
  handlers: Handlers,
) {
  if (variant === 'trash') {
    return [
      ...(flags.canEdit
        ? [
            {
              id: 'restore-document',
              label: 'Przywróć',
              icon: <IoArrowUndoOutline className="h-4 w-4" />,
              onSelect: () => handlers.onRestoreDocument(document.id),
            },
          ]
        : []),
      ...(flags.isDirector
        ? [
            {
              id: 'delete-permanently',
              label: 'Usuń trwale',
              icon: <IoTrashOutline className="h-4 w-4" />,
              tone: 'danger' as const,
              onSelect: () => handlers.onDeletePermanently(document.id),
            },
          ]
        : []),
    ];
  }

  return [
    ...(flags.canEdit
      ? [
          {
            id: 'new-version',
            label: 'Wgraj nową wersję',
            icon: <IoCreateOutline className="h-4 w-4" />,
            onSelect: () => handlers.onNewVersion(document.id),
          },
          {
            id: 'rename-document',
            label: 'Zmień nazwę',
            icon: <IoCreateOutline className="h-4 w-4" />,
            onSelect: () => handlers.onRenameDocument(document.id),
          },
        ]
      : []),
    ...(flags.canManage
      ? [
          {
            id: 'share-document',
            label: 'Udostępnij',
            icon: <IoPersonAddOutline className="h-4 w-4" />,
            onSelect: () => handlers.onShare(document.id),
          },
        ]
      : []),
    ...(document.status === 'DRAFT' && flags.canEdit
      ? [
          {
            id: 'submit-document',
            label: flags.canManage ? 'Zatwierdź' : 'Przekaż do akceptacji',
            icon: <IoSendOutline className="h-4 w-4" />,
            onSelect: () => handlers.onSubmitForApproval(document.id),
          },
        ]
      : []),

    ...(document.status === 'PENDING_APPROVAL' && flags.canManage
      ? [
          {
            id: 'approve-document',
            label: 'Akceptuj',
            icon: <IoCheckmarkOutline className="h-4 w-4" />,
            onSelect: () => handlers.onApprove(document.id),
          },
        ]
      : []),
    ...(document.status === 'APPROVED' && flags.canManage
      ? [
          {
            id: 'mark-signed',
            label: 'Oznacz jako podpisany',
            icon: <IoDocumentTextOutline className="h-4 w-4" />,
            onSelect: () => handlers.onMarkSigned(document.id),
          },
        ]
      : []),

    ...(flags.canDelete && flags.canEdit
      ? [
          {
            id: 'delete-document',
            label: 'Usuń',
            icon: <IoTrashOutline className="h-4 w-4" />,
            tone: 'danger' as const,
            onSelect: () => handlers.onDeleteDocument(document.id),
          },
        ]
      : []),
  ];
}
