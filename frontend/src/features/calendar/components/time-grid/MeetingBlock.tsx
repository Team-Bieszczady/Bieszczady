import type { MeetingStatus } from '../../../../lib/api';
import { meetingColorClass } from '../../meetingColors';
import type { CalendarProject, Meeting } from '../../types';
import {
  meetingSize,
  minutesToTop,
  toMinutes,
  type MeetingSize,
  type PlacedMeeting,
} from '../../utils/timeGrid';

const MIN_BLOCK_HEIGHT = 20;

const BLOCK_CLASSES =
  'absolute flex cursor-pointer flex-col items-start justify-start overflow-hidden rounded-md border-l-3 text-left text-dark transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-darkGreen';

const STATUS_DESCRIPTIONS: Record<MeetingStatus, string> = {
  PLANNED: '',
  HELD: ', odbyło się',
  CANCELLED: ', odwołane',
};

function describeMeeting(meeting: Meeting) {
  return `${meeting.title}, ${meeting.startTime}–${meeting.endTime}${STATUS_DESCRIPTIONS[meeting.status]}`;
}

interface MeetingBlockProps {
  placed: PlacedMeeting;
  firstHour: number;
  project: CalendarProject | undefined;
  detailed: boolean;
  onClick: () => void;
}

function titleText(meeting: Meeting) {
  return meeting.status === 'HELD' ? `✓ ${meeting.title}` : meeting.title;
}

function timeText(meeting: Meeting, withPlace: boolean) {
  const time = `${meeting.startTime} – ${meeting.endTime}`;
  return withPlace && meeting.place ? `${time}, ${meeting.place}` : time;
}

function ShortContent({ meeting }: { meeting: Meeting }) {
  return (
    <p className="w-full truncate text-[11px] leading-4">
      <span className="font-semibold">{titleText(meeting)}</span>{' '}
      <span className="text-dark/70">{meeting.startTime}</span>
    </p>
  );
}

interface FullContentProps {
  meeting: Meeting;
  project: CalendarProject | undefined;
  size: MeetingSize;
  detailed: boolean;
}

function FullContent({ meeting, project, size, detailed }: FullContentProps) {
  const titleClamp = size === 'long' && !detailed ? 'line-clamp-2' : 'truncate';

  return (
    <>
      <p className={`w-full text-xs leading-4 font-semibold ${titleClamp}`}>
        {titleText(meeting)}
      </p>
      <p className="w-full truncate text-[11px] leading-4 text-dark/70">
        {timeText(meeting, detailed)}
      </p>
      {detailed && size === 'long' && project && (
        <p className="w-full truncate text-[11px] leading-4 text-grayText">
          {project.name}
        </p>
      )}
    </>
  );
}

export function MeetingBlock({
  placed,
  firstHour,
  project,
  detailed,
  onClick,
}: MeetingBlockProps) {
  const { meeting, column, columns } = placed;
  const size = meetingSize(meeting);
  const isCancelled = meeting.status === 'CANCELLED';

  const top = minutesToTop(toMinutes(meeting.startTime), firstHour);
  const bottom = minutesToTop(toMinutes(meeting.endTime), firstHour);
  const width = 100 / columns;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={describeMeeting(meeting)}
      title={describeMeeting(meeting)}
      style={{
        top,
        height: Math.max(bottom - top, MIN_BLOCK_HEIGHT),
        left: `calc(${column * width}% + 2px)`,
        width: `calc(${width}% - 4px)`,
      }}
      className={`${BLOCK_CLASSES} ${size === 'short' ? 'px-1.5 py-0.5' : 'px-2 py-1'} ${meetingColorClass(project?.color)} ${isCancelled ? 'line-through opacity-60' : ''}`}
    >
      {size === 'short' ? (
        <ShortContent meeting={meeting} />
      ) : (
        <FullContent
          meeting={meeting}
          project={project}
          size={size}
          detailed={detailed}
        />
      )}
    </button>
  );
}
