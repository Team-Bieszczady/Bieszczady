import {
  IoArrowUndoOutline,
  IoCheckmarkOutline,
  IoCreateOutline,
  IoPersonAddOutline,
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
}

export function documentMenuItems(
  document: BackendDocument,
  variant: 'folder' | 'trash',
  canDelete: boolean,
  handlers: Handlers,
) {
  if (variant === 'trash') {
    return [
      {
        id: 'restore-document',
        label: 'Przywróć',
        icon: <IoArrowUndoOutline className="h-4 w-4" />,
        onSelect: () => handlers.onRestoreDocument(document.id),
      },
      {
        id: 'delete-permanently',
        label: 'Usuń trwale',
        icon: <IoTrashOutline className="h-4 w-4" />,
        tone: 'danger' as const,
        onSelect: () => handlers.onDeletePermanently(document.id),
      },
    ];
  }

  return [
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
    {
      id: 'share-document',
      label: 'Udostępnij',
      icon: <IoPersonAddOutline className="h-4 w-4" />,
      onSelect: () => handlers.onShare(document.id),
    },
    ...(document.status === 'PENDING_APPROVAL'
      ? [
          {
            id: 'approve-document',
            label: 'Akceptuj',
            icon: <IoCheckmarkOutline className="h-4 w-4" />,
            onSelect: () => handlers.onApprove(document.id),
          },
        ]
      : []),
    ...(canDelete
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
