import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { isApiError } from '../../../lib/api';
import { useDeleteFolder } from '../hooks/useDeleteFolder';

interface Props {
  projectId: string;
  folderId: string | null;
  folderName?: string;
  onClose: () => void;
  onDeleted: (folderId: string) => void;
}

export function DeleteFolderDialog({
  projectId,
  folderId,
  folderName,
  onClose,
  onDeleted,
}: Props) {
  const deleteFolder = useDeleteFolder(projectId);

  const confirm = () => {
    if (folderId === null) {
      return;
    }
    deleteFolder.mutate(folderId, {
      onSuccess: () => {
        onDeleted(folderId);
        onClose();
      },
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
      isOpen={folderId !== null}
      onClose={onClose}
      onConfirm={confirm}
      title="Usuń folder"
      description={`Czy na pewno chcesz usunąć folder „${folderName}"?`}
      confirmLabel="Usuń"
      tone="danger"
      isPending={deleteFolder.isPending}
    />
  );
}
