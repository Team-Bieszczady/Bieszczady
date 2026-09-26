import { useForm, type SubmitHandler } from 'react-hook-form';
import type { ReactNode } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';

interface Inputs {
  name: string;
}

interface Props {
  isOpen: boolean;
  title: string;
  label: string;
  hint?: ReactNode;
  initialName: string;
  maxLength: number;
  isPending: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function NameFormModal({
  isOpen,
  title,
  label,
  hint,
  initialName,
  maxLength,
  isPending,
  onSubmit,
  onClose,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({ defaultValues: { name: initialName } });

  const submit: SubmitHandler<Inputs> = (data) => {
    onSubmit(data.name.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        {hint && <p className="text-xs text-gray-400">{hint}</p>}

        <div>
          <label className={FIELD_LABEL_CLASSES}>
            {label} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Podaj nazwę..."
            className={INPUT_CLASSES}
            {...register('name', {
              required: 'To pole jest wymagane',
              maxLength: {
                value: maxLength,
                message: `Najwyżej ${maxLength} znaków`,
              },
              validate: (value) =>
                value.trim().length > 0 || 'To pole jest wymagane',
            })}
          />
          <FieldError message={errors.name?.message} />
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
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
