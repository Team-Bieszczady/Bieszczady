import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { showError, showSuccess } from '../utils/toasts';
import { useCreateFolder } from '../hooks/useCreateFolder';

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
  const [newFolderName, setNewFolderName] = useState('');

  const createFolder = useCreateFolder(projectId);

  const close = () => {
    setNewFolderName('');
    onClose();
  };

  const confirm = () => {
    if (newFolderName.trim() === '') {
      return;
    }
    const payload: { name: string; parentId?: string } = {
      name: newFolderName.trim(),
    };
    if (parentId) {
      payload.parentId = parentId;
    }
    createFolder.mutate(payload, {
      onSuccess: () => {
        showSuccess('Folder utworzony');
        close();
      },
      onError: showError,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Nowy folder">
      <div className="space-y-5">
        <p className="text-xs text-gray-400">
          Folder powstanie{' '}
          <span className="font-semibold text-dark">
            {!parentId ? 'na głównym poziomie' : `w folderze ${parentName}`}
          </span>
        </p>

        <div>
          <label className={FIELD_LABEL_CLASSES}>
            Nazwa folderu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Podaj nazwę..."
            maxLength={40}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button variant="outline" size="small" type="button" onClick={close}>
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={confirm}
            disabled={newFolderName.trim() === '' || createFolder.isPending}
            isPending={createFolder.isPending}
            className="font-medium!"
          >
            Zapisz
          </Button>
        </div>
      </div>
    </Modal>
  );
}
