import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import {
  FIELD_LABEL_CLASSES,
  TEXTAREA_CLASSES,
} from '../../../components/ui/formStyles';

interface CommentModalProps {
  title: string;
  label: string;
  hint: string;
  submitLabel: string;
  requiredMessage: string;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

export function CommentModal({
  title,
  label,
  hint,
  submitLabel,
  requiredMessage,
  onClose,
  onSubmit,
}: CommentModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ comment: string }>({ defaultValues: { comment: '' } });

  const submit = handleSubmit(({ comment }) => {
    onSubmit(comment.trim());
    onClose();
  });

  return (
    <Modal isOpen onClose={onClose} title={title}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-xs text-grayText">{hint}</p>
        <div>
          <label className={FIELD_LABEL_CLASSES}>{label}</label>
          <textarea
            rows={4}
            autoFocus
            className={TEXTAREA_CLASSES}
            {...register('comment', {
              validate: (value) => value.trim() !== '' || requiredMessage,
            })}
          />
          <FieldError message={errors.comment?.message} />
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
