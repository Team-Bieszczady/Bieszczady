import { showError, showSuccess } from '../utils/toasts';
import { useCreateFolder } from '../hooks/useCreateFolder';
import { NameFormModal } from './NameFormModal';

interface Props {
  projectId: string;
  isOpen: boolean;
  parentId: string | null;
  parentName?: string;
  onClose: () => void;
}

export function CreateFolderModal({
  projectId,
  isOpen,
  parentId,
  parentName,
  onClose,
}: Props) {
  const createFolder = useCreateFolder(projectId);

  const submit = (name: string) => {
    const payload: { name: string; parentId?: string } = { name };
    if (parentId) {
      payload.parentId = parentId;
    }

    createFolder.mutate(payload, {
      onSuccess: () => {
        showSuccess('Folder utworzony');
        onClose();
      },
      onError: showError,
    });
  };

  return (
    <NameFormModal
      key={isOpen ? (parentId ?? 'root') : 'closed'}
      isOpen={isOpen}
      title="Nowy folder"
      label="Nazwa folderu"
      hint={
        <>
          Folder powstanie{' '}
          <span className="font-semibold text-dark">
            {parentId ? `w folderze ${parentName}` : 'na głównym poziomie'}
          </span>
        </>
      }
      initialName=""
      maxLength={40}
      isPending={createFolder.isPending}
      onSubmit={submit}
      onClose={onClose}
    />
  );
}
