import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { isApiError } from '../../../lib/api';
import { useDeleteDocument } from '../hooks/useDeleteDocument';

interface Props {
  projectId: string;
  folderId: string;
  documentId: string | null;
  documentName?: string;
  onClose: () => void;
}

export function DeleteDocumentDialog({
  projectId,
  folderId,
  documentId,
  documentName,
  onClose,
}: Props) {
  const deleteDocument = useDeleteDocument(projectId, folderId);

  const confirm = () => {
    if (documentId === null) {
      return;
    }
    deleteDocument.mutate(documentId, {
      onSuccess: () => onClose(),
      onError: (error) => {
        const message = isApiError(error)
          ? error.message
          : 'Coś poszło nie tak';
        toast.error(message);
      },
    });
  };

  return (
    <ConfirmDialog
      isOpen={documentId !== null}
      onClose={onClose}
      onConfirm={confirm}
      title="Usuń dokument"
      description={`Czy na pewno chcesz usunąć dokument „${documentName}"?`}
      confirmLabel="Usuń"
      tone="danger"
      isPending={deleteDocument.isPending}
    />
  );
}
