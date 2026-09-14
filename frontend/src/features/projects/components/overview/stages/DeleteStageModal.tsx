import { Controller, useForm, useWatch } from 'react-hook-form';
import { FieldError } from '../../../../../components/ui/FieldError';
import { Modal } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import { RadioOptionCard } from '../../../../../components/ui/RadioOptionCard';
import { Select, type SelectOption } from '../../../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
} from '../../../../../components/ui/formStyles';
import {
  ACTION_FORMS,
  pluralizePl,
  TASK_FORMS,
} from '../../../../../lib/pluralizePl';
import type { Stage } from '../../../types';
import type { DeleteStrategy } from '../../../types';

interface DeleteStageFormInputs {
  mode: 'move' | 'delete';
  targetStageId: string;
}

interface DeleteStageModalProps {
  stage: Stage;
  actionsCount: number;
  tasksCount: number;
  targetOptions: SelectOption[];
  onClose: () => void;
  onConfirm: (strategy: DeleteStrategy) => void;
}

export default function DeleteStageModal({
  stage,
  actionsCount,
  tasksCount,
  targetOptions,
  onClose,
  onConfirm,
}: DeleteStageModalProps) {
  const canMove = targetOptions.length > 0;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DeleteStageFormInputs>({
    defaultValues: { mode: canMove ? 'move' : 'delete', targetStageId: '' },
  });

  const mode = useWatch({ control, name: 'mode' });

  const submit = handleSubmit((values) => {
    if (values.mode === 'move') {
      onConfirm({ kind: 'move', targetStageId: values.targetStageId });
      return;
    }
    onConfirm({ kind: 'delete' });
  });

  const contents = `${pluralizePl(actionsCount, ACTION_FORMS)} i ${pluralizePl(
    tasksCount,
    TASK_FORMS,
  )}`;

  return (
    <Modal isOpen onClose={onClose} title="Usuń etap" size="lg">
      <form onSubmit={submit} className="space-y-5">
        <p className="rounded-lg bg-redSoft px-3 py-2.5 text-xs leading-relaxed text-darkRed">
          Etap „{stage.name}” zawiera {contents}. Wybierz, co ma się z nimi
          stać.
        </p>

        <fieldset className="space-y-2">
          <legend className="sr-only">Co zrobić z zawartością etapu</legend>

          <RadioOptionCard
            value="move"
            registration={register('mode')}
            isSelected={mode === 'move'}
            disabled={!canMove}
            title="Przenieś zawartość do innego etapu"
            hint={
              canMove
                ? 'Przenoszone są całe działania razem ze swoimi zadaniami. Nic nie zostanie utracone.'
                : 'Nie ma dokąd przenieść zawartości — to jedyny otwarty etap w projekcie.'
            }
          >
            <label className={FIELD_LABEL_CLASSES}>Etap docelowy</label>
            <Controller
              name="targetStageId"
              control={control}
              rules={{
                validate: (value) =>
                  mode !== 'move' || !!value || 'Wybierz etap docelowy',
              }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz etap docelowy"
                  options={targetOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.targetStageId}
                />
              )}
            />
            <FieldError message={errors.targetStageId?.message} />
          </RadioOptionCard>

          <RadioOptionCard
            value="delete"
            tone="danger"
            registration={register('mode')}
            isSelected={mode === 'delete'}
            title="Usuń zawartość razem z etapem"
            hint={`${contents} zostaną trwale usunięte. Tej operacji nie można cofnąć.`}
          />
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="ghost" size="small" type="button" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            variant="outline"
            size="small"
            type="submit"
            className="border-darkRed text-darkRed hover:border-darkRed hover:bg-red-50"
          >
            Usuń etap
          </Button>
        </div>
      </form>
    </Modal>
  );
}
