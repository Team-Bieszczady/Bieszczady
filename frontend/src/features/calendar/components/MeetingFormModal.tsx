import { useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { TimeInput } from '../../../components/ui/TimeInput';
import { InviteeCheckboxes } from './InviteeCheckboxes';

export interface MeetingFormInputs {
  projectId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  place: string;
  meetingUrl: string;
  note: string;
  inviteeIds: string[];
}

interface MeetingFormModalProps {
  projectOptions: SelectOption[];
  onClose: () => void;
  onSubmit: (values: MeetingFormInputs) => void;
  isPending?: boolean;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_FORMAT_MESSAGE = 'Wpisz godzinę jak 10:30';

const TEXTAREA_CLASSES =
  'w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none';

export default function MeetingFormModal({
  projectOptions,
  onClose,
  onSubmit,
  isPending = false,
}: MeetingFormModalProps) {
  const titleId = useId();
  const dateId = useId();
  const startId = useId();
  const endId = useId();
  const placeId = useId();
  const linkId = useId();
  const noteId = useId();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<MeetingFormInputs>({
    defaultValues: {
      projectId: '',
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      place: '',
      meetingUrl: '',
      note: '',
      inviteeIds: [],
    },
  });

  const projectId = useWatch({ control, name: 'projectId' });

  return (
    <Modal isOpen onClose={onClose} title="Dodaj spotkanie" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES}>Projekt</label>
          <Controller
            name="projectId"
            control={control}
            rules={{ validate: (value) => !!value || 'Wybierz projekt' }}
            render={({ field }) => (
              <Select
                size="md"
                placeholder="Wybierz"
                options={projectOptions}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  setValue('inviteeIds', []);
                }}
                onBlur={field.onBlur}
                invalid={!!errors.projectId}
              />
            )}
          />
          <FieldError message={errors.projectId?.message} />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={titleId}>
            Tytuł
          </label>
          <input
            {...register('title', {
              validate: (value) =>
                value.trim().length > 0 || 'Tytuł nie może być pusty',
            })}
            id={titleId}
            type="text"
            placeholder="Np. Spotkanie z gminą"
            aria-invalid={!!errors.title}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={dateId}>
              Data
            </label>
            <input
              {...register('date', { required: 'Podaj datę' })}
              id={dateId}
              type="date"
              aria-invalid={!!errors.date}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.date?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={startId}>
              Od
            </label>
            <Controller
              name="startTime"
              control={control}
              rules={{
                required: 'Podaj godzinę',
                validate: (value) =>
                  TIME_PATTERN.test(value) || TIME_FORMAT_MESSAGE,
              }}
              render={({ field }) => (
                <TimeInput
                  id={startId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.startTime}
                />
              )}
            />
            <FieldError message={errors.startTime?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={endId}>
              Do
            </label>
            <Controller
              name="endTime"
              control={control}
              rules={{
                required: 'Podaj godzinę',
                validate: {
                  format: (value) =>
                    TIME_PATTERN.test(value) || TIME_FORMAT_MESSAGE,
                  afterStart: (value, values) =>
                    value > values.startTime ||
                    'Koniec musi być później niż początek',
                },
              }}
              render={({ field }) => (
                <TimeInput
                  id={endId}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!errors.endTime}
                />
              )}
            />
            <FieldError message={errors.endTime?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={placeId}>
              Miejsce (opcjonalnie)
            </label>
            <input
              {...register('place')}
              id={placeId}
              type="text"
              placeholder="Np. Sala 2"
              className={INPUT_CLASSES}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={linkId}>
              Link do spotkania (opcjonalnie)
            </label>
            <input
              {...register('meetingUrl')}
              id={linkId}
              type="url"
              placeholder="https://..."
              className={INPUT_CLASSES}
            />
          </div>
        </div>

        {projectId && (
          <InviteeCheckboxes
            projectId={projectId}
            registration={register('inviteeIds')}
          />
        )}

        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={noteId}>
            Notatka (opcjonalnie)
          </label>
          <textarea
            {...register('note')}
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
            disabled={isPending}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            className="font-medium!"
            disabled={isPending}
          >
            {isPending ? 'Zapisywanie…' : 'Zapisz'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
