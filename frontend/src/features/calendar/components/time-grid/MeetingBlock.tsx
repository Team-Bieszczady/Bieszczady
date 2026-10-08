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

const MIN_BLOCK_HEIGHT = 22;

const BLOCK_CLASSES =
  'absolute flex cursor-pointer flex-col items-start justify-start overflow-hidden rounded-r-lg text-left text-dark transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-darkGreen';

const PADDING: Record<MeetingSize, string> = {
  short: 'py-0.5 pr-2 pl-3',
  medium: 'py-1.5 pr-2 pl-3',
  long: 'py-2 pr-2 pl-3',
};

const DAY_STYLE = {
  title: 'text-sm',
  detail: 'text-xs',
  edgeGap: 8,
};

const WEEK_STYLE = {
  title: 'text-xs',
  detail: 'text-[11px]',
  edgeGap: 4,
};

type BlockStyle = typeof DAY_STYLE;

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

interface ContentProps {
  meeting: Meeting;
  project: CalendarProject | undefined;
  size: MeetingSize;
  detailed: boolean;
  style: BlockStyle;
}

function ShortContent({ meeting, style }: ContentProps) {
  return (
    <p className="w-full truncate leading-5">
      <span className={`font-semibold ${style.title}`}>
        {titleText(meeting)}
      </span>{' '}
      <span className={`text-gray-500 ${style.detail}`}>
        {meeting.startTime}
      </span>
    </p>
  );
}

function FullContent({
  meeting,
  project,
  size,
  detailed,
  style,
}: ContentProps) {
  const wrapsTitle = size === 'long' && !detailed;

  return (
    <>
      <p
        className={`w-full leading-snug font-semibold ${style.title} ${wrapsTitle ? 'line-clamp-2 wrap-break-word' : 'truncate'}`}
      >
        {titleText(meeting)}
      </p>
      <p
        className={`mt-1 w-full truncate leading-4 text-gray-500 ${style.detail}`}
      >
        {timeText(meeting, detailed)}
      </p>
      {detailed && project && (
        <p
          className={`w-full truncate leading-4 text-gray-400 ${style.detail}`}
        >
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
  const size = meetingSize(placed.visibleMinutes);
  const style = detailed ? DAY_STYLE : WEEK_STYLE;
  const colors = meetingColors(project?.color);
  const isCancelled = meeting.status === 'CANCELLED';

  const top = minutesToTop(toMinutes(meeting.startTime), firstHour);
  const bottom = minutesToTop(toMinutes(meeting.endTime), firstHour);
  const { left, width } = horizontalPlacement(placed, style.edgeGap);

  const Content = size === 'short' ? ShortContent : FullContent;
  const faded = isCancelled ? 'opacity-60' : '';
  const isStacked = placed.depth > 0;

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
        zIndex: placed.depth + 1,
      }}
      className={`${BLOCK_CLASSES} ${PADDING[size]} bg-white ${isStacked ? 'ring-1 ring-white' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 ${colors.tint} ${faded}`}
      />
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 rounded-full ${colors.accent} ${faded}`}
      />
      <span
        className={`relative flex w-full flex-col items-start ${isCancelled ? 'line-through' : ''} ${faded}`}
      >
        <Content
          meeting={meeting}
          project={project}
          size={size}
          detailed={detailed}
          style={style}
        />
      </span>
    </button>
  );
}
