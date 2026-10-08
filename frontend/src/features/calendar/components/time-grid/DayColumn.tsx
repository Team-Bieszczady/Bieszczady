import type { CalendarProject, Meeting } from '../../types';
import {
  minutesToTop,
  placeSideBySide,
  placeStacked,
} from '../../utils/timeGrid';
import { MeetingBlock } from './MeetingBlock';

interface DayColumnProps {
  meetings: Meeting[];
  projects: CalendarProject[];
  hours: number[];
  firstHour: number;
  height: number;
  isHighlighted: boolean;
  nowTop: number | null;
  detailed: boolean;
  onMeetingClick: (meetingId: string) => void;
}

function HourLines({
  hours,
  firstHour,
}: {
  hours: number[];
  firstHour: number;
}) {
  return hours
    .slice(1)
    .map((hour) => (
      <div
        key={hour}
        className="absolute inset-x-0 border-t border-gray-200"
        style={{ top: minutesToTop(hour * 60, firstHour) }}
      />
    ));
}

function NowLine({ top }: { top: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-10 border-t border-darkRed"
      style={{ top }}
    >
      <span className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-darkRed" />
    </div>
  );
}

export function DayColumn({
  meetings,
  projects,
  hours,
  firstHour,
  height,
  isHighlighted,
  nowTop,
  detailed,
  onMeetingClick,
}: DayColumnProps) {
  const projectOf = (meeting: Meeting) =>
    projects.find((project) => project.id === meeting.projectId);
  const placeMeetings = detailed ? placeSideBySide : placeStacked;

  return (
    <div
      className={`relative flex-1 border-l border-gray-200 ${isHighlighted ? 'bg-gray-50' : ''}`}
      style={{ height }}
    >
      <HourLines hours={hours} firstHour={firstHour} />

      {placeMeetings(meetings).map((placed) => (
        <MeetingBlock
          key={placed.meeting.id}
          placed={placed}
          firstHour={firstHour}
          project={projectOf(placed.meeting)}
          detailed={detailed}
          onClick={() => onMeetingClick(placed.meeting.id)}
        />
      ))}

      {nowTop !== null && <NowLine top={nowTop} />}
    </div>
  );
}
