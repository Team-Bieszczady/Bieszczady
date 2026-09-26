import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import type { BackendFolder } from '../../../lib/api';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { FieldError } from '../../../components/ui/FieldError';
import { FIELD_LABEL_CLASSES } from '../../../components/ui/formStyles';

interface Inputs {
  folderId: string;
}

interface Props {
  documentId: string | null;
  folders: BackendFolder[];
  isPending: boolean;
  onSubmit: (folderId: string) => void;
  onClose: () => void;
}

export function RestoreDocumentModal({
  documentId,
  folders,
  isPending,
  onSubmit,
  onClose,
}: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({ defaultValues: { folderId: '' } });

  const folderOptions = folders.map((folder) => ({
    value: folder.id,
    label: folder.name,
  }));

  const submit: SubmitHandler<Inputs> = (data) => {
    onSubmit(data.folderId);
  };

  return (
    <Modal
      isOpen={documentId !== null}
      onClose={onClose}
      title="Przywróć dokument"
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <p className="text-sm text-dark/75">
          Folder tego dokumentu został usunięty. Wybierz, gdzie go przywrócić.
        </p>

        <div>
          <label className={FIELD_LABEL_CLASSES}>
            Folder <span className="text-red-500">*</span>
          </label>
          <Controller
            name="folderId"
            control={control}
            rules={{ required: 'Wybierz folder' }}
            render={({ field }) => (
              <Select
                size="md"
                options={folderOptions}
                placeholder="Wybierz"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          <FieldError message={errors.folderId?.message} />
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
            isPending={isPending}
            className="font-medium!"
          >
            Przywróć
          </Button>
        </div>
      </form>
    </Modal>
  );
}
