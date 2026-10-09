import { useId } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { LuClock, LuMapPin, LuUsers } from 'react-icons/lu';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { TimeInput } from '../../../components/ui/TimeInput';
import { INPUT_CLASSES } from '../../../components/ui/formStyles';
import type { BackendMeetingDetails } from '../../../lib/api';
import { todayIso } from '../../projects/utils/isoDate';
import type { NewMeetingSlot } from '../types';
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
  meeting?: BackendMeetingDetails;
  slot?: NewMeetingSlot | null;
  copyOf?: BackendMeetingDetails | null;
  projectOptions: SelectOption[];
  onClose: () => void;
  onSubmit: (values: MeetingFormInputs) => void;
  isPending?: boolean;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_FORMAT_MESSAGE = 'Wpisz godzinę jak 10:30';

function linkOrEmpty(value: string) {
  const link = value.trim();

  if (link === '') {
    return true;
  }

  if (link.startsWith('http://') || link.startsWith('https://')) {
    return true;
  }

  return 'Link musi zaczynać się od http:// albo https://';
}

function inviteeIdsOf(meeting: BackendMeetingDetails) {
  return meeting.invitees.map((invitee) => invitee.user.id);
}

function startingValues(
  meeting: BackendMeetingDetails | undefined,
  slot: NewMeetingSlot | null | undefined,
  copyOf: BackendMeetingDetails | null | undefined,
): MeetingFormInputs {
  if (meeting) {
    return {
      projectId: meeting.projectId,
      title: meeting.title,
      date: meeting.date,
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      place: meeting.place || '',
      meetingUrl: meeting.meetingUrl || '',
      note: meeting.note,
      inviteeIds: inviteeIdsOf(meeting),
    };
  }

  if (copyOf) {
    return {
      projectId: copyOf.projectId,
      title: copyOf.title,
      date: '',
      startTime: copyOf.startTime,
      endTime: copyOf.endTime,
      place: copyOf.place || '',
      meetingUrl: copyOf.meetingUrl || '',
      note: copyOf.note,
      inviteeIds: inviteeIdsOf(copyOf),
    };
  }

  const values: MeetingFormInputs = {
    projectId: '',
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    place: '',
    meetingUrl: '',
    note: '',
    inviteeIds: [],
  };

  if (slot) {
    values.date = slot.date;
    values.startTime = slot.startTime;
    values.endTime = slot.endTime;
  }

  return values;
}

function heldMeetingDate(value: string, meeting?: BackendMeetingDetails) {
  if (meeting && meeting.status === 'HELD' && value > todayIso()) {
    return 'Spotkanie już się odbyło, więc nie może mieć daty w przyszłości';
  }

  return true;
}

const LABEL_CLASSES = 'mb-2 flex items-center gap-1.5 text-sm text-dark/80';
const TEXTAREA_CLASSES =
  'w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none';

export default function MeetingFormModal({
  meeting,
  slot,
  copyOf,
  projectOptions,
  onClose,
  onSubmit,
  isPending = false,
}: MeetingFormModalProps) {
  const titleId = useId();
  const placeId = useId();
  const linkId = useId();
  const noteId = useId();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<MeetingFormInputs>({
    defaultValues: startingValues(meeting, slot, copyOf),
  });

  const isCopy = !meeting && !!copyOf;

  const keepOnlyTeamMembers = (memberIds: string[]) => {
    if (meeting) {
      return;
    }

    const chosen = getValues('inviteeIds');
    const kept = chosen.filter((userId) => memberIds.includes(userId));
    if (kept.length !== chosen.length) {
      setValue('inviteeIds', kept);
    }
  };

  const projectId = useWatch({ control, name: 'projectId' });
  const whenError =
    errors.date?.message ??
    errors.startTime?.message ??
    errors.endTime?.message;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={meeting ? 'Edytuj spotkanie' : 'Dodaj spotkanie'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label className={LABEL_CLASSES} htmlFor={titleId}>
            Nazwa spotkania
          </label>
          <input
            {...register('title', {
              validate: (value) =>
                value.trim().length > 0 || 'Podaj nazwę spotkania',
            })}
            id={titleId}
            type="text"
            maxLength={200}
            autoFocus={!isCopy}
            placeholder="Podaj nazwę, np. Spotkanie zespołu"
            aria-invalid={!!errors.title}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <div>
          <p className={LABEL_CLASSES}>Projekt</p>
          {meeting ? (
            <p className="flex h-8 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-dark/75">
              {meeting.project.name}
            </p>
          ) : (
            <>
              <Controller
                name="projectId"
                control={control}
                rules={{ validate: (value) => !!value || 'Wybierz projekt' }}
                render={({ field }) => (
                  <Select
                    size="md"
                    placeholder="Wybierz projekt"
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
            </>
          )}
        </div>

        <fieldset>
          <legend className={LABEL_CLASSES}>
            <LuClock size={14} aria-hidden="true" />
            Kiedy
          </legend>
          <div className="flex flex-wrap items-center gap-2">
            <input
              {...register('date', {
                required: 'Podaj datę spotkania',
                validate: (value) => heldMeetingDate(value, meeting),
              })}
              type="date"
              autoFocus={isCopy}
              aria-label="Data"
              aria-invalid={!!errors.date}
              className={`${INPUT_CLASSES} sm:w-36!`}
            />
            <div className="flex items-center gap-2">
              <div className="w-24">
                <Controller
                  name="startTime"
                  control={control}
                  rules={{
                    required: 'Podaj godzinę rozpoczęcia',
                    validate: (value) =>
                      TIME_PATTERN.test(value) || TIME_FORMAT_MESSAGE,
                  }}
                  render={({ field }) => (
                    <TimeInput
                      ariaLabel="Godzina rozpoczęcia"
                      placeholder="9:00"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      invalid={!!errors.startTime}
                    />
                  )}
                />
              </div>
              <span className="text-dark" aria-hidden="true">
                –
              </span>
              <div className="w-24">
                <Controller
                  name="endTime"
                  control={control}
                  rules={{
                    required: 'Podaj godzinę zakończenia',
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
                      ariaLabel="Godzina zakończenia"
                      placeholder="10:00"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      invalid={!!errors.endTime}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <FieldError message={whenError} />
        </fieldset>

        <fieldset>
          <legend className={LABEL_CLASSES}>
            <LuUsers size={14} aria-hidden="true" />
            Uczestnicy
          </legend>
          {projectId ? (
            <InviteeCheckboxes
              projectId={projectId}
              registration={register('inviteeIds')}
              onTeamLoaded={keepOnlyTeamMembers}
            />
          ) : (
            <p className="text-xs text-grayText">
              Wybierz projekt, aby zobaczyć jego zespół.
            </p>
          )}
        </fieldset>

        <div>
          <label className={LABEL_CLASSES} htmlFor={placeId}>
            <LuMapPin size={14} aria-hidden="true" />
            Miejsce
          </label>
          <input
            {...register('place')}
            id={placeId}
            type="text"
            maxLength={200}
            placeholder="np. Urząd Gminy, sala nr 3"
            className={INPUT_CLASSES}
          />
          <FieldError />
        </div>

        <div>
          <label className={LABEL_CLASSES} htmlFor={linkId}>
            Link do spotkania
          </label>
          <input
            {...register('meetingUrl', { validate: linkOrEmpty })}
            id={linkId}
            type="url"
            maxLength={1000}
            placeholder="wklej link do Google Meet / Zoom"
            aria-invalid={!!errors.meetingUrl}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.meetingUrl?.message} />
        </div>

        <div>
          <label className={LABEL_CLASSES} htmlFor={noteId}>
            Notatka
          </label>
          <textarea
            {...register('note')}
            id={noteId}
            rows={2}
            maxLength={2000}
            placeholder="dodaj notatkę"
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
