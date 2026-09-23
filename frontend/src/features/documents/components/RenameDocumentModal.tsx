import { showError, showSuccess } from '../utils/toasts';
import { useUpdateDocument } from '../hooks/useUpdateDocument';
import { NameFormModal } from './NameFormModal';

interface Props {
  projectId: string;
  folderId: string;
  documentId: string | null;
  currentName: string;
  onClose: () => void;
}

export function RenameDocumentModal({
  projectId,
  folderId,
  documentId,
  currentName,
  onClose,
}: Props) {
  const updateDocument = useUpdateDocument(projectId, folderId);

  const submit = (name: string) => {
    if (documentId === null) {
      return;
    }
    updateDocument.mutate(
      { documentId, name },
      {
        onSuccess: () => {
          showSuccess('Nazwa dokumentu zmieniona');
          onClose();
        },
        onError: showError,
      },
    );
  };

  return (
    <NameFormModal
      key={documentId ?? 'closed'}
      isOpen={documentId !== null}
      title="Zmień nazwę dokumentu"
      label="Nazwa dokumentu"
      initialName={currentName}
      maxLength={200}
      isPending={updateDocument.isPending}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
