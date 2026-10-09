import toast from 'react-hot-toast';
import {
  LuClock,
  LuFileText,
  LuLink,
  LuMapPin,
  LuPencil,
  LuPrinter,
  LuTrash2,
  LuStickyNote,
  LuUsers,
} from 'react-icons/lu';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../context/useAuth';
import type { BackendMeetingDetails, MeetingOutcome } from '../../../lib/api';
import { hasModule } from '../../../lib/modules';
import { formatStageDate, todayIso } from '../../projects/utils/isoDate';
import { useMeeting } from '../hooks/useMeeting';
import { useOpenProjectPage } from '../hooks/useOpenProjectPage';
import { useSetMeetingOutcome } from '../hooks/useSetMeetingOutcome';
import { formatWeekday } from '../utils/calendarView';
import { printAttendanceSheet } from '../utils/attendanceSheet';
import { formatLongDate } from '../utils/formatLongDate';
import { AttendanceFilesSection } from './AttendanceFilesSection';
import { useRestoreMeeting } from '../hooks/useRestoreMeeting';
import {
  ConfirmedByNote,
  MEETING_OUTCOME_FORM_ID,
  MeetingOutcomeForm,
} from './MeetingOutcomeForm';
import { ProjectName } from './ProjectName';

interface MeetingDetailsModalProps {
  meetingId: string;
  onClose: () => void;
  onEdit: (meeting: BackendMeetingDetails) => void;
  onDelete: (meeting: BackendMeetingDetails) => void;
}

const OUTCOME_TOAST_ID = 'meeting-outcome';

const ROW_CLASSES = 'flex items-start gap-3 text-sm text-dark';
const ICON_CLASSES = 'mt-0.5 shrink-0 text-grayText';

const STATUS_BADGES = {
  planned: { label: 'Zaplanowane', classes: 'bg-gray-100 text-gray-600' },
  waiting: {
    label: 'Czeka na zatwierdzenie',
    classes: 'bg-amber-100 text-amber-800',
  },
  held: { label: '✓ Odbyło się', classes: 'bg-darkGreen text-white' },
  cancelled: { label: '✕ Odwołane', classes: 'bg-gray-100 text-dark' },
};

function isUpcoming(meeting: BackendMeetingDetails) {
  return meeting.status === 'PLANNED' && meeting.date > todayIso();
}

function isCancelledAhead(meeting: BackendMeetingDetails) {
  return meeting.status === 'CANCELLED' && meeting.date > todayIso();
}

function statusBadgeOf(meeting: BackendMeetingDetails) {
  if (meeting.status === 'HELD') return STATUS_BADGES.held;
  if (meeting.status === 'CANCELLED') return STATUS_BADGES.cancelled;
  return isUpcoming(meeting) ? STATUS_BADGES.planned : STATUS_BADGES.waiting;
}

function StatusBadge({ meeting }: { meeting: BackendMeetingDetails }) {
  const { label, classes } = statusBadgeOf(meeting);

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {label}
    </span>
  );
}

function OutcomeSummary({ meeting }: { meeting: BackendMeetingDetails }) {
  const held = meeting.status === 'HELD';

  return (
    <div className="space-y-4">
      <p className="text-sm text-dark/80">Potwierdzenie realizacji</p>
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
          held ? 'bg-darkGreen text-white' : 'bg-gray-100 text-dark'
        }`}
      >
        {held ? '✓ Odbyło się' : '✕ Odwołane'}
      </span>
      {held && meeting.attendeeCount !== null && (
        <p className="text-sm text-dark">
          Liczba uczestników: {meeting.attendeeCount}
        </p>
      )}
      {meeting.attendanceFiles.length > 0 && (
        <AttendanceFilesSection
          meetingId={meeting.id}
          files={meeting.attendanceFiles}
          editable={false}
        />
      )}
      <ConfirmedByNote meeting={meeting} />
    </div>
  );
}

interface OutcomePanelProps {
  meeting: BackendMeetingDetails;
  onSubmit: (outcome: MeetingOutcome) => void;
  isPending: boolean;
  onRestore: () => void;
  isRestoring: boolean;
}

function OutcomePanel({
  meeting,
  onSubmit,
  isPending,
  onRestore,
  isRestoring,
}: OutcomePanelProps) {
  if (!meeting.canManage) return <OutcomeSummary meeting={meeting} />;

  if (isCancelledAhead(meeting)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-dark/80">Potwierdzenie realizacji</p>
        <p className="text-xs leading-relaxed text-grayText">
          Spotkanie jest odwołane. Jeśli jednak się odbędzie, przywróć je, a
          wróci do kalendarza jako zaplanowane.
        </p>
        <Button
          variant="outline"
          size="small"
          type="button"
          onClick={onRestore}
          isPending={isRestoring}
          className="font-medium!"
        >
          Przywróć spotkanie
        </Button>
        <ConfirmedByNote meeting={meeting} />
      </div>
    );
  }

  if (isUpcoming(meeting)) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-dark/80">Potwierdzenie realizacji</p>
        <p className="text-xs leading-relaxed text-grayText">
          Spotkanie zatwierdzisz w dniu, w którym się odbędzie. Wtedy wpiszesz
          też liczbę uczestników i dodasz skany listy obecności.
        </p>
        <Button
          variant="outline"
          size="small"
          type="button"
          onClick={() => onSubmit({ status: 'CANCELLED' })}
          isPending={isPending}
          className="font-medium!"
        >
          ✕ Odwołaj spotkanie
        </Button>
      </div>
    );
  }

  return <MeetingOutcomeForm meeting={meeting} onSubmit={onSubmit} />;
}

export default function MeetingDetailsModal({
  meetingId,
  onClose,
  onEdit,
  onDelete,
}: MeetingDetailsModalProps) {
  const meetingQuery = useMeeting(meetingId);
  const meeting = meetingQuery.data;
  const setOutcome = useSetMeetingOutcome();
  const restoreMeeting = useRestoreMeeting();
  const { user } = useAuth();
  const openProjectPage = useOpenProjectPage(onClose);

  const showOutcome =
    !!meeting && (meeting.canManage || meeting.status !== 'PLANNED');
  const canOpenProject =
    hasModule(user, 'PROJECTS') && hasModule(user, 'OVERVIEW');

  const submitOutcome = (outcome: MeetingOutcome) => {
    let message = 'Zmiany zapisane';
    if (meeting && meeting.status === 'PLANNED') {
      if (outcome.status === 'HELD') {
        message = 'Spotkanie zatwierdzone';
      } else {
        message = 'Spotkanie oznaczone jako odwołane';
      }
    }

    setOutcome.mutate(
      { id: meetingId, outcome },
      {
        onSuccess: () => toast.success(message, { id: OUTCOME_TOAST_ID }),
        onError: (error) =>
          toast.error(error.message, { id: OUTCOME_TOAST_ID }),
      },
    );
  };

  const restore = () => {
    restoreMeeting.mutate(meetingId, {
      onSuccess: () => toast.success('Spotkanie przywrócone'),
      onError: (error) => toast.error(error.message),
    });
  };

  const header = (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-lightGreen px-3 py-1 text-xs font-semibold text-darkGreen">
          Spotkanie
        </span>
        {meeting && <StatusBadge meeting={meeting} />}
      </div>
      <h2 className="text-xl font-semibold text-dark">
        {meeting?.title ?? (meetingQuery.isError ? 'Spotkanie' : 'Ładowanie…')}
      </h2>
    </div>
  );

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={meeting?.title ?? 'Spotkanie'}
      header={header}
      size={showOutcome ? 'xl' : 'lg'}
    >
      {meetingQuery.isError && (
        <p role="alert" className="text-sm text-darkRed">
          {meetingQuery.error.message}
        </p>
      )}

      {meeting && (
        <div className={showOutcome ? 'grid gap-8 md:grid-cols-2' : ''}>
          <div className="flex flex-col gap-5 pb-2 md:pb-0">
            <div className={ROW_CLASSES}>
              <LuClock size={18} className={ICON_CLASSES} aria-hidden="true" />
              <div>
                <p>
                  {formatStageDate(meeting.date)} –{' '}
                  {formatWeekday(meeting.date)}
                </p>
                <p className="mt-0.5 text-grayText">
                  {meeting.startTime} – {meeting.endTime}
                </p>
              </div>
            </div>

            <div className={ROW_CLASSES}>
              <LuFileText
                size={18}
                className={ICON_CLASSES}
                aria-hidden="true"
              />
              <ProjectName
                name={meeting.project.name}
                onOpen={
                  canOpenProject
                    ? () =>
                        openProjectPage(meeting.projectId, '/project/overview')
                    : undefined
                }
              />
            </div>

            {meeting.place && (
              <div className={ROW_CLASSES}>
                <LuMapPin
                  size={18}
                  className={ICON_CLASSES}
                  aria-hidden="true"
                />
                <p>{meeting.place}</p>
              </div>
            )}

            {meeting.meetingUrl && (
              <div className={ROW_CLASSES}>
                <LuLink size={18} className={ICON_CLASSES} aria-hidden="true" />
                <a
                  href={meeting.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-darkGreen underline hover:text-darkGreenHover"
                >
                  {meeting.meetingUrl}
                </a>
              </div>
            )}

            <div className={ROW_CLASSES}>
              <LuUsers size={18} className={ICON_CLASSES} aria-hidden="true" />
              {meeting.invitees.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Uczestnicy">
                  {meeting.invitees.map(({ user }) => (
                    <li
                      key={user.id}
                      className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-dark"
                    >
                      {user.firstName} {user.lastName}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-grayText">Nikt nie został zaproszony</p>
              )}
            </div>

            {meeting.canManage && meeting.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => printAttendanceSheet(meeting)}
                className="inline-flex cursor-pointer items-center gap-2 self-start text-sm font-medium text-darkGreen hover:text-darkGreenHover hover:underline"
              >
                <LuPrinter size={16} aria-hidden="true" />
                Drukuj listę obecności
              </button>
            )}

            {meeting.note && (
              <div className={ROW_CLASSES}>
                <LuStickyNote
                  size={18}
                  className={ICON_CLASSES}
                  aria-hidden="true"
                />
                <p className="min-w-0 flex-1 rounded-lg bg-gray-100 px-4 py-3 text-xs leading-relaxed wrap-break-word whitespace-pre-line text-grayText">
                  <span className="sr-only">Notatka: </span>
                  {meeting.note}
                </p>
              </div>
            )}

            <p className="mt-auto text-xs text-grayText">
              Utworzył(a): {meeting.createdBy.firstName}{' '}
              {meeting.createdBy.lastName}, {formatLongDate(meeting.createdAt)}
            </p>
          </div>

          {showOutcome && (
            <div className="border-t border-gray-200 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
              <OutcomePanel
                meeting={meeting}
                onSubmit={submitOutcome}
                isPending={setOutcome.isPending}
                onRestore={restore}
                isRestoring={restoreMeeting.isPending}
              />
            </div>
          )}
        </div>
      )}

      {meeting?.canManage && (
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-200 pt-4 sm:flex sm:items-center sm:justify-between">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={() => onDelete(meeting)}
            className="gap-1.5 border-darkRed text-darkRed hover:bg-red-50"
          >
            <LuTrash2 size={14} aria-hidden="true" />
            Usuń
          </Button>
          <div className="contents sm:flex sm:gap-3">
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={() => onEdit(meeting)}
              className="gap-1.5"
            >
              <LuPencil size={14} aria-hidden="true" />
              Edytuj
            </Button>
            {!isUpcoming(meeting) && !isCancelledAhead(meeting) && (
              <Button
                variant="primary"
                size="small"
                type="submit"
                form={MEETING_OUTCOME_FORM_ID}
                isPending={setOutcome.isPending}
                className="col-span-2 font-medium!"
              >
                {meeting.status === 'PLANNED'
                  ? 'Zatwierdź spotkanie'
                  : 'Zapisz zmiany'}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
