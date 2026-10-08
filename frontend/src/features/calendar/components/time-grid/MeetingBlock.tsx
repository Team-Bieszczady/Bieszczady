import type { MeetingStatus } from '../../../../lib/api';
import { meetingColors } from '../../meetingColors';
import type { CalendarProject, Meeting } from '../../types';
import {
  horizontalPlacement,
  meetingSize,
  minutesToTop,
  toMinutes,
  type MeetingSize,
  type PlacedMeeting,
} from '../../utils/timeGrid';

const MIN_BLOCK_HEIGHT = 20;
const DAY_EDGE_GAP = 8;
const WEEK_EDGE_GAP = 3;

const BLOCK_CLASSES =
  'absolute flex cursor-pointer flex-col items-start justify-start overflow-hidden rounded-r-md text-left text-dark transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-darkGreen';

const DAY_PADDING: Record<MeetingSize, string> = {
  short: 'py-0.5 pr-2 pl-3',
  medium: 'py-1 pr-3 pl-3.5',
  long: 'py-1.5 pr-3 pl-3.5',
};

const WEEK_PADDING: Record<MeetingSize, string> = {
  short: 'py-0.5 pr-1.5 pl-2',
  medium: 'py-1 pr-1.5 pl-2.5',
  long: 'py-1.5 pr-1.5 pl-2.5',
};

const DAY_TEXT = { title: 'text-[13px]', detail: 'text-xs' };
const WEEK_TEXT = { title: 'text-xs', detail: 'text-[11px]' };

type TextSizes = typeof DAY_TEXT;

const STATUS_DESCRIPTIONS: Record<MeetingStatus, string> = {
  PLANNED: '',
  HELD: ', odbyło się',
  CANCELLED: ', odwołane',
};

interface MeetingBlockProps {
  placed: PlacedMeeting;
  firstHour: number;
  project: CalendarProject | undefined;
  detailed: boolean;
  onClick: () => void;
}

function describeMeeting(meeting: Meeting) {
  return `${meeting.title}, ${meeting.startTime}–${meeting.endTime}${STATUS_DESCRIPTIONS[meeting.status]}`;
}

function titleText(meeting: Meeting) {
  return meeting.status === 'HELD' ? `✓ ${meeting.title}` : meeting.title;
}

function timeText(meeting: Meeting, withPlace: boolean) {
  const time = `${meeting.startTime} – ${meeting.endTime}`;
  return withPlace && meeting.place ? `${time}, ${meeting.place}` : time;
}

interface ShortContentProps {
  meeting: Meeting;
  text: TextSizes;
}

function ShortContent({ meeting, text }: ShortContentProps) {
  return (
    <p className="w-full truncate leading-4">
      <span className={`font-semibold ${text.title}`}>
        {titleText(meeting)}
      </span>{' '}
      <span className={`text-gray-500 ${text.detail}`}>
        {meeting.startTime}
      </span>
    </p>
  );
}

interface FullContentProps {
  meeting: Meeting;
  project: CalendarProject | undefined;
  size: MeetingSize;
  detailed: boolean;
  text: TextSizes;
}

function FullContent({
  meeting,
  project,
  size,
  detailed,
  text,
}: FullContentProps) {
  const titleClamp = size === 'long' && !detailed ? 'line-clamp-2' : 'truncate';

  return (
    <>
      <p
        className={`w-full leading-4 font-semibold ${text.title} ${titleClamp}`}
      >
        {titleText(meeting)}
      </p>
      <p className={`w-full truncate leading-4 text-gray-500 ${text.detail}`}>
        {timeText(meeting, detailed)}
      </p>
      {detailed && size === 'long' && project && (
        <p className={`w-full truncate leading-4 text-gray-400 ${text.detail}`}>
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
  const { meeting } = placed;
  const size = meetingSize(meeting);
  const padding = detailed ? DAY_PADDING[size] : WEEK_PADDING[size];
  const text = detailed ? DAY_TEXT : WEEK_TEXT;
  const colors = meetingColors(project?.color);
  const isCancelled = meeting.status === 'CANCELLED';

  const top = minutesToTop(toMinutes(meeting.startTime), firstHour);
  const bottom = minutesToTop(toMinutes(meeting.endTime), firstHour);
  const { left, width } = horizontalPlacement(
    placed,
    detailed ? DAY_EDGE_GAP : WEEK_EDGE_GAP,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={describeMeeting(meeting)}
      title={describeMeeting(meeting)}
      style={{
        top,
        height: Math.max(bottom - top, MIN_BLOCK_HEIGHT),
        left,
        width,
      }}
      className={`${BLOCK_CLASSES} ${padding} ${colors.tint} ${isCancelled ? 'line-through opacity-60' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-0.75 rounded-full ${colors.accent}`}
      />
      {size === 'short' ? (
        <ShortContent meeting={meeting} text={text} />
      ) : (
        <FullContent
          meeting={meeting}
          project={project}
          size={size}
          detailed={detailed}
          text={text}
        />
      )}
    </button>
  );
}
