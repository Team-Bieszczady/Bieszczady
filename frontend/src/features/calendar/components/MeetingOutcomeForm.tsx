import { useId } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FieldError } from '../../../components/ui/FieldError';
import { RadioPillGroup } from '../../../components/ui/RadioPillGroup';
import { INPUT_CLASSES } from '../../../components/ui/formStyles';
import type { BackendMeetingDetails, MeetingOutcome } from '../../../lib/api';
import { todayIso } from '../../projects/utils/isoDate';
import { formatLongDate } from '../utils/formatLongDate';
import { AttendanceFilesSection } from './AttendanceFilesSection';

export const MEETING_OUTCOME_FORM_ID = 'meeting-outcome-form';

interface OutcomeInputs {
  status: '' | MeetingOutcome['status'];
  attendeeCount: string;
}

interface MeetingOutcomeFormProps {
  meeting: BackendMeetingDetails;
  onSubmit: (outcome: MeetingOutcome) => void;
}

const OUTCOME_OPTIONS = [
  { value: 'HELD', label: '✓ Odbyło się' },
  { value: 'CANCELLED', label: '✕ Odwołane' },
];

export function MeetingOutcomeForm({
  meeting,
  onSubmit,
}: MeetingOutcomeFormProps) {
  const countId = useId();
  const hasStarted = meeting.date <= todayIso();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<OutcomeInputs>({
    defaultValues: {
      status: meeting.status === 'PLANNED' ? '' : meeting.status,
      attendeeCount: meeting.attendeeCount?.toString() ?? '',
    },
  });

  const status = useWatch({ control, name: 'status' });

  const submit = ({ status, attendeeCount }: OutcomeInputs) => {
    if (status === 'HELD') {
      onSubmit({ status, attendeeCount: Number(attendeeCount) });
    } else if (status === 'CANCELLED') {
      onSubmit({ status });
    }
  };

  return (
    <form
      id={MEETING_OUTCOME_FORM_ID}
      onSubmit={handleSubmit(submit)}
      className="space-y-5"
    >
      <div>
        <RadioPillGroup
          legend="Potwierdzenie realizacji"
          options={OUTCOME_OPTIONS}
          value={status}
          registration={register('status', {
            validate: (value) => {
              if (!value) return 'Wybierz, czy spotkanie się odbyło';
              if (value === 'HELD' && !hasStarted) {
                return 'Spotkanie jeszcze się nie odbyło';
              }
              return true;
            },
          })}
        />
        <FieldError message={errors.status?.message} />
      </div>

      {status === 'HELD' && (
        <div>
          <label htmlFor={countId} className="mb-2 block text-sm text-dark/80">
            Rzeczywista liczba uczestników
          </label>
          <input
            {...register('attendeeCount', {
              validate: (value, values) =>
                values.status !== 'HELD' ||
                /^\d+$/.test(value.trim()) ||
                'Podaj liczbę uczestników',
            })}
            id={countId}
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="np. 18"
            aria-invalid={!!errors.attendeeCount}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.attendeeCount?.message} />
        </div>
      )}

      {status === 'HELD' && hasStarted && (
        <AttendanceFilesSection
          meetingId={meeting.id}
          files={meeting.attendanceFiles}
          editable
        />
      )}

      {meeting.confirmedBy && meeting.confirmedAt && (
        <p className="text-xs text-grayText">
          Zatwierdził(a): {meeting.confirmedBy.firstName}{' '}
          {meeting.confirmedBy.lastName}, {formatLongDate(meeting.confirmedAt)}
        </p>
      )}
    </form>
  );
}
