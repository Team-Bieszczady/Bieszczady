import toast from 'react-hot-toast';
import {
  LuClock,
  LuFileText,
  LuLink,
  LuMapPin,
  LuPencil,
  LuTrash2,
  LuUsers,
} from 'react-icons/lu';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { BackendMeetingDetails, MeetingOutcome } from '../../../lib/api';
import { formatStageDate } from '../../projects/utils/isoDate';
import { useMeeting } from '../hooks/useMeeting';
import { useSetMeetingOutcome } from '../hooks/useSetMeetingOutcome';
import { formatLongDate } from '../utils/formatLongDate';
import { AttendanceFilesSection } from './AttendanceFilesSection';
import {
  MEETING_OUTCOME_FORM_ID,
  MeetingOutcomeForm,
} from './MeetingOutcomeForm';

interface MeetingDetailsModalProps {
  meetingId: string;
  onClose: () => void;
  onEdit: (meeting: BackendMeetingDetails) => void;
  onDelete: (meeting: BackendMeetingDetails) => void;
}

const ROW_CLASSES = 'flex items-start gap-3 text-sm text-dark';
const ICON_CLASSES = 'mt-0.5 shrink-0 text-grayText';

function weekdayOf(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pl-PL', {
    weekday: 'long',
  });
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
      {meeting.confirmedBy && meeting.confirmedAt && (
        <p className="text-xs text-grayText">
          Zatwierdził(a): {meeting.confirmedBy.firstName}{' '}
          {meeting.confirmedBy.lastName}, {formatLongDate(meeting.confirmedAt)}
        </p>
      )}
    </div>
  );
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

  const showOutcome =
    !!meeting && (meeting.canManage || meeting.status !== 'PLANNED');

  const submitOutcome = (outcome: MeetingOutcome) => {
    setOutcome.mutate(
      { id: meetingId, outcome },
      {
        onSuccess: () =>
          toast.success(
            outcome.status === 'HELD'
              ? 'Spotkanie zatwierdzone'
              : 'Spotkanie oznaczone jako odwołane',
          ),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const header = (
    <div className="flex flex-col items-start gap-3">
      <span className="rounded-full bg-lightGreen px-3 py-1 text-xs font-semibold text-darkGreen">
        Spotkanie
      </span>
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
          <div className="space-y-5 pb-2">
            <div className={ROW_CLASSES}>
              <LuClock size={18} className={ICON_CLASSES} aria-hidden="true" />
              <div>
                <p>
                  {formatStageDate(meeting.date)} – {weekdayOf(meeting.date)}
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
              <p className="font-medium text-darkGreen">
                {meeting.project.name}
              </p>
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

            {meeting.note && (
              <p className="rounded-lg bg-gray-100 px-4 py-3 text-xs leading-relaxed wrap-break-word whitespace-pre-line text-grayText">
                {meeting.note}
              </p>
            )}

            <p className="text-xs text-grayText">
              Utworzył(a): {meeting.createdBy.firstName}{' '}
              {meeting.createdBy.lastName}, {formatLongDate(meeting.createdAt)}
            </p>
          </div>

          {showOutcome && (
            <div className="border-t border-gray-200 pt-6 md:border-t-0 md:border-l md:pt-0 md:pl-8">
              {meeting.canManage ? (
                <MeetingOutcomeForm
                  meeting={meeting}
                  onSubmit={submitOutcome}
                />
              ) : (
                <OutcomeSummary meeting={meeting} />
              )}
            </div>
          )}
        </div>
      )}

      {meeting?.canManage && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4">
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
          <div className="flex flex-wrap gap-3">
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
            <Button
              variant="primary"
              size="small"
              type="submit"
              form={MEETING_OUTCOME_FORM_ID}
              isPending={setOutcome.isPending}
              className="font-medium!"
            >
              Zatwierdź spotkanie
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
