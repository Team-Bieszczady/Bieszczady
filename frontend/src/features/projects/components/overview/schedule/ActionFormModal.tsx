import { useId } from 'react';
import { FieldError } from '../../../../../components/ui/FieldError';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../../../../components/ui/Button';
import { Modal } from '../../../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../../../components/ui/formStyles';
import type { ScheduleAction } from '../../../types';

export interface ActionFormInputs {
  title: string;
  stageId: string;
}

export type ActionFormMode = 'add' | 'edit' | 'move';

interface ActionFormModalProps {
  mode: ActionFormMode;
  action: ScheduleAction | null;
  stageOptions: SelectOption[];
  onClose: () => void;
  onSubmit: (values: ActionFormInputs) => void;
}

const TITLES: Record<ActionFormMode, string> = {
  add: 'Dodaj działanie',
  edit: 'Zmień nazwę działania',
  move: 'Przenieś działanie do innego etapu',
};

const SUBMIT_LABELS: Record<ActionFormMode, string> = {
  add: 'Dodaj działanie',
  edit: 'Zapisz',
  move: 'Przenieś',
};

export default function ActionFormModal({
  mode,
  action,
  stageOptions,
  onClose,
  onSubmit,
}: ActionFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ActionFormInputs>({
    defaultValues: {
      title: action?.title ?? '',
      stageId: action?.stageId ?? stageOptions[0]?.value ?? '',
    },
  });

  const titleId = useId();
  const showTitle = mode !== 'move';
  const showStage = mode !== 'edit';

  return (
    <Modal isOpen onClose={onClose} title={TITLES[mode]}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {mode === 'move' && action && (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
            <p className="text-[10px] font-semibold tracking-[0.5px] text-mutedText">
              DZIAŁANIE
            </p>
            <p className="mt-1 text-sm font-bold text-dark">{action.title}</p>
          </div>
        )}

        {showTitle && (
          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={titleId}>
              Nazwa działania
            </label>
            <input
              {...register('title', {
                validate: (value) =>
                  value.trim().length > 0 ||
                  'Nazwa działania nie może być pusta',
              })}
              id={titleId}
              autoFocus
              type="text"
              placeholder="np. Przeprowadzenie warsztatów"
              aria-invalid={!!errors.title}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.title?.message} />
          </div>
        )}

        {showStage && (
          <div>
            <label className={FIELD_LABEL_CLASSES}>Etap</label>
            <Controller
              name="stageId"
              control={control}
              rules={{ validate: (value) => !!value || 'Wybierz etap' }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz etap"
                  options={stageOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.stageId}
                />
              )}
            />
            <FieldError message={errors.stageId?.message} />
            <p className="mt-1 text-[11px] text-mutedText">
              Zadania tego działania przeniosą się razem z nim.
            </p>
          </div>
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
            {SUBMIT_LABELS[mode]}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
