import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import type { BackendFolder } from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { FieldError } from '../../../components/ui/FieldError';
import { FIELD_LABEL_CLASSES } from '../../../components/ui/formStyles';
import { showError, showSuccess } from '../utils/toasts';
import { useMoveFolder } from '../hooks/useMoveFolder';
import { collectSubtreeIds } from '../utils/folderTree';

const ROOT = 'ROOT';

interface Inputs {
  parentId: string;
}

interface Props {
  projectId: string;
  folderId: string | null;
  folders: BackendFolder[];
  onMoved: (parentId: string | null) => void;
  onClose: () => void;
}

export function MoveFolderModal({
  projectId,
  folderId,
  folders,
  onMoved,
  onClose,
}: Props) {
  const moveFolder = useMoveFolder(projectId);

  const folder = folders.find((el) => el.id === folderId);
  const blocked = folderId
    ? collectSubtreeIds(folders, folderId)
    : new Set<string>();

  const options = [
    { value: ROOT, label: 'Główny poziom' },
    ...folders
      .filter((el) => !blocked.has(el.id))
      .map((el) => ({ value: el.id, label: el.name })),
  ];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: { parentId: folder?.parentId ?? ROOT },
  });

  const submit: SubmitHandler<Inputs> = (data) => {
    if (!folderId) {
      return;
    }

    const parentId = data.parentId === ROOT ? null : data.parentId;
    if (folder && parentId === folder.parentId) {
      onClose();
      return;
    }

    moveFolder.mutate(
      { folderId, parentId },
      {
        onSuccess: () => {
          showSuccess('Folder przeniesiony');
          onMoved(parentId);
          onClose();
        },
        onError: showError,
      },
    );
  };

  return (
    <Modal
      isOpen={folderId !== null}
      onClose={onClose}
      title={`Przenieś: ${folder?.name ?? ''}`}
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES}>
            Folder nadrzędny <span className="text-red-500">*</span>
          </label>
          <Controller
            name="parentId"
            control={control}
            rules={{ required: 'Wybierz folder' }}
            render={({ field }) => (
              <Select
                size="md"
                allowEmpty={false}
                options={options}
                placeholder="Wybierz"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.parentId?.message} />
          <p className="mt-1 text-xs text-gray-400">
            Lista pomija ten folder i jego podfoldery.
          </p>
        </div>

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            isPending={moveFolder.isPending}
            className="font-medium!"
          >
            Przenieś
          </Button>
        </div>
      </form>
    </Modal>
  );
}
