import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import {
  FIELD_LABEL_CLASSES,
  TEXTAREA_CLASSES,
} from '../../../components/ui/formStyles';
import { formatDate } from '../../people/utils/formatDateTime';
import type { AnnexMetadata } from '../budgetReducer';

interface ApproveAnnexModalProps {
  title: string;
  submitLabel: string;
  approvedAt: string | null;
  initial: AnnexMetadata | null;
  onClose: () => void;
  onSubmit: (metadata: AnnexMetadata) => void;
}

export function ApproveAnnexModal({
  title,
  submitLabel,
  approvedAt,
  initial,
  onClose,
  onSubmit,
}: ApproveAnnexModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AnnexMetadata>({
    defaultValues: initial ?? { description: '' },
  });

  const submit = handleSubmit((metadata) => {
    onSubmit({ description: metadata.description.trim() });
    onClose();
  });

  return (
    <Modal isOpen onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <p className={FIELD_LABEL_CLASSES}>Data zatwierdzenia aneksu</p>
          <p className="text-sm font-medium text-dark">
            {formatDate(approvedAt ?? new Date().toISOString())}
          </p>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES}>Krótki opis</label>
          <textarea
            rows={3}
            placeholder="np. Przesunięcie środków z administracji na ewaluację"
            className={TEXTAREA_CLASSES}
            {...register('description', {
              validate: (value) => value.trim() !== '' || 'Podaj opis aneksu',
            })}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button type="submit" variant="primary" size="small">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
