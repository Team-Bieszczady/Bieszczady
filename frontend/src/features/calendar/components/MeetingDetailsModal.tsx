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
import type { BackendMeetingDetails } from '../../../lib/api';
import { formatStageDate } from '../../projects/utils/isoDate';
import { useMeeting } from '../hooks/useMeeting';

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

function formatCreatedAt(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function MeetingDetailsModal({
  meetingId,
  onClose,
  onEdit,
  onDelete,
}: MeetingDetailsModalProps) {
  const meetingQuery = useMeeting(meetingId);
  const meeting = meetingQuery.data;

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
      size="lg"
    >
      {meetingQuery.isError && (
        <p role="alert" className="text-sm text-darkRed">
          {meetingQuery.error.message}
        </p>
      )}

      {meeting && (
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
            <LuFileText size={18} className={ICON_CLASSES} aria-hidden="true" />
            <p className="font-medium text-darkGreen">{meeting.project.name}</p>
          </div>

          {meeting.place && (
            <div className={ROW_CLASSES}>
              <LuMapPin size={18} className={ICON_CLASSES} aria-hidden="true" />
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
            <p className="rounded-lg bg-gray-100 px-4 py-3 text-xs leading-relaxed break-words whitespace-pre-line text-grayText">
              {meeting.note}
            </p>
          )}

          <p className="text-xs text-grayText">
            Utworzył(a): {meeting.createdBy.firstName}{' '}
            {meeting.createdBy.lastName}, {formatCreatedAt(meeting.createdAt)}
          </p>
        </div>
      )}

      {meeting?.canManage && (
        <div className="mt-6 flex justify-between border-t border-gray-200 pt-4">
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
        </div>
      )}
    </Modal>
  );
}
