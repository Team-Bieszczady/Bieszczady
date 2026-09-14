import { useId } from 'react';
import { FieldError } from '../../../../../components/ui/FieldError';
import { useForm, useWatch } from 'react-hook-form';
import { Modal } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../../../components/ui/formStyles';
import type { Stage } from '../../../types';

export interface StageFormInputs {
  name: string;
  deadline: string;
  startDate: string;
  description: string;
}

interface StageFormModalProps {
  mode: 'add' | 'edit';
  stage: Stage | null;
  onClose: () => void;
  onSubmit: (values: StageFormInputs) => void;
}

export default function StageFormModal({
  mode,
  stage,
  onClose,
  onSubmit,
}: StageFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StageFormInputs>({
    defaultValues: {
      name: stage?.name ?? '',
      deadline: stage?.deadline ?? '',
      startDate: stage?.startDate ?? '',
      description: stage?.description ?? '',
    },
  });

  const nameId = useId();
  const deadlineId = useId();
  const startId = useId();
  const descriptionId = useId();

  const startDate = useWatch({ control, name: 'startDate' });

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={mode === 'add' ? 'Dodaj etap' : 'Edytuj etap'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={nameId}>
            Nazwa etapu
          </label>
          <input
            {...register('name', {
              validate: (value) =>
                value.trim().length > 0 || 'Nazwa etapu nie może być pusta',
            })}
            id={nameId}
            autoFocus
            type="text"
            placeholder="np. Uzgodnienia"
            aria-invalid={!!errors.name}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.name?.message} />
        </div>

        {mode === 'add' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL_CLASSES} htmlFor={deadlineId}>
                Termin
              </label>
              <input
                {...register('deadline', {
                  required: 'Termin etapu jest wymagany',
                  validate: (value) =>
                    !startDate ||
                    value >= startDate ||
                    'Termin nie może być wcześniejszy niż data rozpoczęcia',
                })}
                id={deadlineId}
                type="date"
                aria-invalid={!!errors.deadline}
                className={INPUT_CLASSES}
              />
              <FieldError message={errors.deadline?.message} />
            </div>

            <div>
              <label className={FIELD_LABEL_CLASSES} htmlFor={startId}>
                Data rozpoczęcia{' '}
                <span className="font-normal text-mutedText">
                  (opcjonalnie)
                </span>
              </label>
              <input
                {...register('startDate')}
                id={startId}
                type="date"
                aria-invalid={!!errors.startDate}
                className={INPUT_CLASSES}
              />
              <FieldError message={errors.startDate?.message} />
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-grayText">
            Termin i datę rozpoczęcia zmienisz przez „Przenieś termin” — dzięki
            temu każda zmiana zostawia ślad wraz z komentarzem.
          </p>
        )}

        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={descriptionId}>
            Opis{' '}
            <span className="font-normal text-mutedText">(opcjonalnie)</span>
          </label>
          <textarea
            {...register('description')}
            id={descriptionId}
            rows={3}
            placeholder="Krótki opis etapu..."
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
          />
        </div>

        {mode === 'add' && (
          <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed text-grayText">
            Nowy etap powstaje pusty — działania i zadania dodasz w
            harmonogramie. Do tego czasu etap ma status „Planowany”.
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
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
            className="font-medium!"
          >
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
