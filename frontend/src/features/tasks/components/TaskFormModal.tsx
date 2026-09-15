import { useId } from 'react';
import { FieldError } from '../../../components/ui/FieldError';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { RadioPillGroup } from '../../../components/ui/RadioPillGroup';
import { Select, type SelectOption } from '../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../../projects/labels';
import type { TaskPriority, TaskStatus } from '../../projects/types';
import type { TaskRow } from '../data';

export interface TaskFormInputs {
  title: string;
  actionId: string;
  ownerId: string;
  dueDate: string;
  priority: TaskPriority | '';
  status: TaskStatus;
  description: string;
}

interface TaskFormModalProps {
  mode: 'add' | 'edit';
  task: TaskRow | null;
  actionOptions: SelectOption[];
  ownerOptions: SelectOption[];
  /** Start date of the stage behind an action, so a task cannot predate it. */
  stageStartFor: (actionId: string) => string | null;
  onClose: () => void;
  onSubmit: (values: TaskFormInputs) => void;
  isSubmitting?: boolean;
}

const UNASSIGNED = '';

const TEXTAREA_CLASSES =
  'w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none';

export default function TaskFormModal({
  mode,
  task,
  actionOptions,
  ownerOptions,
  stageStartFor,
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
  const noteId = useId();

  const owners: SelectOption[] = [
    { value: UNASSIGNED, label: 'Bez przypisania' },
    ...ownerOptions,
  ];
  const statusOptions =
    mode === 'add'
      ? TASK_STATUS_OPTIONS.filter((option) => option.value !== 'DONE')
      : TASK_STATUS_OPTIONS;

  const status = useWatch({ control, name: 'status' });
  const actionId = useWatch({ control, name: 'actionId' });
  const stageStart = actionId ? stageStartFor(actionId) : null;

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
            <label className={FIELD_LABEL_CLASSES}>Osoba odpowiedzialna</label>
            <Controller
              name="ownerId"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={owners}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={dueDateId}>
              Termin
            </label>
            <input
              {...register('dueDate', {
                validate: (value) =>
                  !value ||
                  !stageStart ||
                  value >= stageStart ||
                  'Termin zadania nie może być wcześniejszy niż data rozpoczęcia etapu',
              })}
              id={dueDateId}
              type="date"
              min={stageStart ?? undefined}
              aria-invalid={!!errors.dueDate}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.dueDate?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  onChange={(value) => field.onChange(value as TaskPriority)}
                  onBlur={field.onBlur}
                  invalid={!!errors.priority}
                />
              )}
            />
            <FieldError message={errors.priority?.message} />
          </div>

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
                Brak działań w otwartych etapach — najpierw dodaj działanie w
                Harmonogramie.
              </p>
            )}
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
