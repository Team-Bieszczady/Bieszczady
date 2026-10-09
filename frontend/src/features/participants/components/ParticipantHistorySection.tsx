import type { MeetingStatus, ParticipantMeeting } from '../../../lib/api';
import {
  MEETING_FORMS,
  pluralizePl,
  type PluralForms,
} from '../../../lib/pluralizePl';
import { formatNumericDate } from '../../projects/utils/isoDate';
import { useParticipantHistory } from '../hooks/useParticipantHistory';

const HELD_BADGE = {
  label: '✓ Odbyło się',
  classes: 'bg-darkGreen text-white',
};
const WAITING_BADGE = {
  label: 'Czeka na zatwierdzenie',
  classes: 'bg-amber-100 text-amber-800',
};

function badgeOf(status: MeetingStatus) {
  if (status === 'HELD') {
    return HELD_BADGE;
  }

  return WAITING_BADGE;
}

const HIDDEN_FORMS: PluralForms = [
  'spotkanie w projekcie, do którego nie masz dostępu',
  'spotkania w projektach, do których nie masz dostępu',
  'spotkań w projektach, do których nie masz dostępu',
];

function HistoryRow({ meeting }: { meeting: ParticipantMeeting }) {
  const badge = badgeOf(meeting.status);

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-dark">
          {meeting.title}
        </p>
        <p className="mt-0.5 text-xs text-grayText">
          {formatNumericDate(meeting.date)}, {meeting.startTime} –{' '}
          {meeting.endTime}
        </p>
        <p className="truncate text-xs text-grayText">{meeting.projectName}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge.classes}`}
      >
        {badge.label}
      </span>
    </li>
  );
}

export function ParticipantHistorySection({
  participantId,
}: {
  participantId: string;
}) {
  const historyQuery = useParticipantHistory(participantId);

  if (historyQuery.isPending) {
    return <p className="text-xs text-grayText">Ładowanie historii…</p>;
  }

  if (historyQuery.isError) {
    return (
      <p role="alert" className="text-xs text-darkRed">
        {historyQuery.error.message}
      </p>
    );
  }

  const { meetings, hiddenCount } = historyQuery.data;
  const total = meetings.length + hiddenCount;

  return (
    <section aria-label="Historia spotkań">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="text-sm text-dark/80">Historia spotkań</p>
        <p className="text-xs text-grayText">
          {pluralizePl(total, MEETING_FORMS)}
        </p>
      </div>

      {total === 0 && (
        <p className="text-xs leading-relaxed text-grayText">
          Ta osoba nie była jeszcze na żadnym spotkaniu. Dopiszesz ją w
          kalendarzu, w szczegółach odbytego spotkania.
        </p>
      )}

      {meetings.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {meetings.map((meeting) => (
            <HistoryRow key={meeting.id} meeting={meeting} />
          ))}
        </ul>
      )}

      {hiddenCount > 0 && (
        <p className="mt-2 text-xs text-grayText">
          {meetings.length > 0 ? 'Oraz ' : ''}
          {pluralizePl(hiddenCount, HIDDEN_FORMS)}.
        </p>
      )}
    </section>
  );
}
