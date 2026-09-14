import { useId } from 'react';
import { FieldError } from '../../../../components/ui/FieldError';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../../../components/ui/Button';
import { Modal } from '../../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
} from '../../../../components/ui/formStyles';
import type { RiskLevelValue } from '../../../../lib/projectsApi';
import { RISK_LEVEL_OPTIONS } from '../../labels';
import type { RiskFormValues, RiskView } from '../../hooks/useProjectRisks';

interface RiskFormInputs {
  description: string;
  probability: RiskLevelValue;
  impact: RiskLevelValue;
  responsibleUserId: string;
}

interface RiskFormModalProps {
  mode: 'add' | 'edit';
  risk: RiskView | null;
  ownerOptions: SelectOption[];
  onClose: () => void;
  onSubmit: (values: RiskFormValues) => void;
}

export default function RiskFormModal({
  mode,
  risk,
  ownerOptions,
  onClose,
  onSubmit,
}: RiskFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RiskFormInputs>({
    defaultValues: {
      description: risk?.description ?? '',
      probability: risk?.probability ?? 'MEDIUM',
      impact: risk?.impact ?? 'MEDIUM',
      responsibleUserId: risk?.responsibleUserId ?? '',
    },
  });

  const descriptionId = useId();

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={mode === 'add' ? 'Dodaj ryzyko' : 'Edytuj ryzyko'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={descriptionId}>
            Opis ryzyka
          </label>
          <textarea
            {...register('description', {
              validate: (value) =>
                value.trim().length > 0 || 'Opis ryzyka nie może być pusty',
            })}
            id={descriptionId}
            autoFocus
            rows={3}
            placeholder="np. Może zabraknąć zgody właściciela działki."
            aria-invalid={!!errors.description}
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
          />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Prawdopodobieństwo</label>
            <Controller
              name="probability"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz poziom"
                  options={RISK_LEVEL_OPTIONS}
                  value={field.value}
                  onChange={(value) => field.onChange(value as RiskLevelValue)}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div>
            <label className={FIELD_LABEL_CLASSES}>Wpływ</label>
            <Controller
              name="impact"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz poziom"
                  options={RISK_LEVEL_OPTIONS}
                  value={field.value}
                  onChange={(value) => field.onChange(value as RiskLevelValue)}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES}>Odpowiedzialny</label>
          <Controller
            name="responsibleUserId"
            control={control}
            rules={{
              validate: (value) => !!value || 'Wskaż osobę odpowiedzialną',
            }}
            render={({ field }) => (
              <Select
                size="md"
                placeholder="Wybierz osobę"
                options={ownerOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.responsibleUserId}
              />
            )}
          />
          <FieldError message={errors.responsibleUserId?.message} />
          {ownerOptions.length === 0 && (
            <p className="mt-1 text-[11px] text-mutedText">
              Najpierw dodaj kogoś do zespołu projektu.
            </p>
          )}
        </div>

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
