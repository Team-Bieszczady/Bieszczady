import { showError, showSuccess } from '../utils/toasts';
import { useUpdateFolder } from '../hooks/useUpdateFolder';
import { NameFormModal } from './NameFormModal';

interface Props {
  projectId: string;
  folderId: string | null;
  currentName: string;
  onClose: () => void;
}

export function RenameFolderModal({
  projectId,
  folderId,
  currentName,
  onClose,
}: Props) {
  const updateFolder = useUpdateFolder(projectId);

  const submit = (name: string) => {
    if (folderId === null) {
      return;
    }
    updateFolder.mutate(
      { folderId, name },
      {
        onSuccess: () => {
          showSuccess('Nazwa folderu zmieniona');
          onClose();
        },
        onError: showError,
      },
    );
  };

  return (
    <NameFormModal
      key={folderId ?? 'closed'}
      isOpen={folderId !== null}
      title="Zmień nazwę"
      label="Nazwa folderu"
      initialName={currentName}
      maxLength={40}
      isPending={updateFolder.isPending}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
