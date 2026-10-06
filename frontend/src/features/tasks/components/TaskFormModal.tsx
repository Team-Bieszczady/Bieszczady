import { useId } from 'react';
import { FieldError } from '../../../components/ui/FieldError';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { DateInput } from '../../../components/ui/DateInput';
import { Modal } from '../../../components/ui/Modal';
import { RadioPillGroup } from '../../../components/ui/RadioPillGroup';
import { Select, type SelectOption } from '../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
  TEXTAREA_CLASSES,
} from '../../../components/ui/formStyles';
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../../projects/labels';
import type { TaskPriorityValue } from '../../../lib/projectsApi';
import type { TaskFormValues } from '../../projects/types';
import {
  formatNumericDate,
  toIsoDate,
} from '../../projects/utils/isoDate';
import { NO_OPEN_ACTIONS_MESSAGE } from '../constants';
import type { TaskRow } from '../data';

export type TaskFormInputs = Omit<
  TaskFormValues,
  'priority' | 'dueDate' | 'ownerId'
> & {
  priority: TaskPriorityValue | '';
  dueDate: string;
  ownerId: string;
};

export interface TaskFormStage {
  name: string;
  startDate: string | null;
  deadline: string;
}

interface TaskFormModalProps {
  mode: 'add' | 'edit';
  task: TaskRow | null;
  actionOptions: SelectOption[];
  ownerOptions: SelectOption[];
  stageFor: (actionId: string) => TaskFormStage | null;
  onClose: () => void;
  onSubmit: (values: TaskFormInputs) => void;
  isSubmitting?: boolean;
}

const UNASSIGNED = '';

export default function TaskFormModal({
  mode,
  task,
  actionOptions,
  ownerOptions,
  stageFor,
  onClose,
  onSubmit,
  isSubmitting = false,
}: TaskFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TaskFormInputs>({
    defaultValues: {
      title: task?.title ?? '',
      actionId: task?.actionId ?? '',
      ownerId: task?.ownerId ?? UNASSIGNED,
      dueDate: task?.dueDate ?? '',
      priority: task?.priority ?? '',
      status: task?.status ?? 'NEW',
      description: task?.description ?? '',
    },
  });

  const titleId = useId();
  const dueDateId = useId();
  const dueDateHintId = useId();
  const noteId = useId();

  const statusOptions =
    mode === 'add'
      ? TASK_STATUS_OPTIONS.filter((option) => option.value !== 'DONE')
      : TASK_STATUS_OPTIONS;

  const status = useWatch({ control, name: 'status' });
  const actionId = useWatch({ control, name: 'actionId' });
  const dueDate = useWatch({ control, name: 'dueDate' });
  const stage = actionId ? stageFor(actionId) : null;
  const stageStart = stage?.startDate ? toIsoDate(stage.startDate) : null;
  const stageDeadline = stage ? toIsoDate(stage.deadline) : null;
  const isPastStage = !!dueDate && !!stageDeadline && dueDate > stageDeadline;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={mode === 'add' ? 'Dodaj zadanie' : 'Edytuj zadanie'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={titleId}>
            Nazwa zadania
          </label>
          <input
            {...register('title', {
              validate: (value) =>
                value.trim().length > 0 || 'Nazwa zadania nie może być pusta',
            })}
            id={titleId}
            autoFocus
            type="text"
            placeholder="Podaj nazwe..."
            aria-invalid={!!errors.title}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.title?.message} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Działanie</label>
            <Controller
              name="actionId"
              control={control}
              rules={{ validate: (value) => !!value || 'Wybierz działanie' }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={actionOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.actionId}
                />
              )}
            />
            <FieldError message={errors.actionId?.message} />
            {actionOptions.length === 0 && (
              <p className="mt-1 text-[11px] text-mutedText">
                {NO_OPEN_ACTIONS_MESSAGE}
              </p>
            )}
          </div>

          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={dueDateId}>
              Termin
            </label>
            <Controller
              name="dueDate"
              control={control}
              rules={{
                validate: (value) =>
                  !value ||
                  !stageStart ||
                  value >= stageStart ||
                  'Termin zadania nie może być wcześniejszy niż data rozpoczęcia etapu',
              }}
              render={({ field }) => (
                <DateInput
                  id={dueDateId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={stageStart ?? undefined}
                  invalid={!!errors.dueDate}
                  aria-describedby={dueDateHintId}
                />
              )}
            />
            <FieldError message={errors.dueDate?.message} />
            <div id={dueDateHintId} className="mt-1 text-[11px]">
              {stage ? (
                <p className="text-mutedText">
                  Etap „{stage.name}”:{' '}
                  {stageStart
                    ? `${formatNumericDate(stageStart)} – ${formatNumericDate(stage.deadline)}`
                    : `do ${formatNumericDate(stage.deadline)}`}
                </p>
              ) : (
                !actionId && (
                  <p className="text-mutedText">
                    Wybierz działanie, aby zobaczyć ramy czasowe etapu
                  </p>
                )
              )}
              {isPastStage && (
                <p className="text-amberDark">
                  Termin po zakończeniu etapu ({formatNumericDate(stage!.deadline)}),
                  etap może się opóźnić.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Osoba odpowiedzialna</label>
            <Controller
              name="ownerId"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Bez przypisania"
                  options={ownerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div>
            <label className={FIELD_LABEL_CLASSES}>Priorytet</label>
            <Controller
              name="priority"
              control={control}
              rules={{ validate: (value) => !!value || 'Wybierz priorytet' }}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={TASK_PRIORITY_OPTIONS}
                  value={field.value}
                  onChange={(value) => field.onChange(value as TaskPriorityValue)}
                  onBlur={field.onBlur}
                  invalid={!!errors.priority}
                />
              )}
            />
            <FieldError message={errors.priority?.message} />
          </div>
        </div>

        <RadioPillGroup
          legend="Status"
          options={statusOptions}
          value={status}
          registration={register('status')}
        />

        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={noteId}>
            Notatka
          </label>
          <textarea
            {...register('description')}
            id={noteId}
            rows={3}
            placeholder="Dodatkowe informacje"
            className={TEXTAREA_CLASSES}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            className="font-medium!"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Zapisywanie…' : 'Zapisz'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
