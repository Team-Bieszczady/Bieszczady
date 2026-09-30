import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { showError, showSuccess } from '../utils/toasts';
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
        showSuccess('Folder usunięty');
        onDeleted(folderId);
        onClose();
      },
      onError: showError,
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
