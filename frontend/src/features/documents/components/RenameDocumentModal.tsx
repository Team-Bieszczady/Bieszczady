import toast from 'react-hot-toast';
import { isApiError } from '../../../lib/api';
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
        onSuccess: onClose,
        onError: (error) => {
          const message = isApiError(error)
            ? error.message
            : 'Coś poszło nie tak';
          toast.error(message);
        },
      },
    );
  };

  return (
    <NameFormModal
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
