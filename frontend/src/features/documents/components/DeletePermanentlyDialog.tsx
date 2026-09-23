import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useDeleteDocumentPermanently } from '../hooks/useDeleteDocumentPermanently';
import { showError, showSuccess } from '../utils/toasts';

interface Props {
  projectId: string;
  documentId: string | null;
  documentName?: string;
  onClose: () => void;
}

export function DeletePermanentlyDialog({
  projectId,
  documentId,
  documentName,
  onClose,
}: Props) {
  const deletePermanently = useDeleteDocumentPermanently(projectId);

  const confirm = () => {
    if (documentId === null) {
      return;
    }
    deletePermanently.mutate(documentId, {
      onSuccess: () => {
        showSuccess('Dokument usunięty na zawsze');
        onClose();
      },
      onError: showError,
    });
  };

  return (
    <ConfirmDialog
      isOpen={documentId !== null}
      onClose={onClose}
      onConfirm={confirm}
      title="Usuń trwale"
      description={`Dokument „${documentName}" i wszystkie jego wersje zostaną usunięte na zawsze. Tej operacji nie da się cofnąć.`}
      confirmLabel="Usuń trwale"
      tone="danger"
      isPending={deletePermanently.isPending}
    />
  );
}
