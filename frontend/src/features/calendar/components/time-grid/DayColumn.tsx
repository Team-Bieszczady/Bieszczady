import { useState, type MouseEvent } from 'react';
import type { CalendarProject, Meeting, NewMeetingSlot } from '../../types';
import {
  minutesToTime,
  minutesToTop,
  newMeetingSlot,
  placeSideBySide,
  placeStacked,
  SLOT_HEIGHT,
  slotStartAt,
} from '../../utils/timeGrid';
import { MeetingBlock } from './MeetingBlock';

interface DayColumnProps {
  day: string;
  meetings: Meeting[];
  projects: CalendarProject[];
  hours: number[];
  firstHour: number;
  height: number;
  isHighlighted: boolean;
  nowTop: number | null;
  detailed: boolean;
  onMeetingClick: (meetingId: string) => void;
  onSlotClick?: (slot: NewMeetingSlot) => void;
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

function SlotHint({ start, firstHour }: { start: number; firstHour: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-1 flex items-start rounded-md bg-darkGreen/8 px-2 pt-0.5 text-[11px] font-medium text-darkGreen"
      style={{ top: minutesToTop(start, firstHour), height: SLOT_HEIGHT }}
    >
      + {minutesToTime(start)}
    </div>
  );
}

export function DayColumn({
  day,
  meetings,
  projects,
  hours,
  firstHour,
  height,
  isHighlighted,
  nowTop,
  detailed,
  onMeetingClick,
  onSlotClick,
}: DayColumnProps) {
  const [hoveredStart, setHoveredStart] = useState<number | null>(null);

  const projectOf = (meeting: Meeting) =>
    projects.find((project) => project.id === meeting.projectId);
  const placeMeetings = detailed ? placeSideBySide : placeStacked;

  const slotUnderMouse = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button')) {
      return null;
    }

    const column = event.currentTarget.getBoundingClientRect();
    return slotStartAt(event.clientY - column.top, firstHour);
  };

  const showHint = (event: MouseEvent<HTMLDivElement>) => {
    setHoveredStart(slotUnderMouse(event));
  };

  const addMeetingHere = (event: MouseEvent<HTMLDivElement>) => {
    if (!onSlotClick) {
      return;
    }

    const start = slotUnderMouse(event);
    if (start === null) {
      return;
    }

    setHoveredStart(null);
    onSlotClick(newMeetingSlot(day, start));
  };

  const canAdd = onSlotClick !== undefined;

  return (
    <div
      className={`relative flex-1 border-l border-gray-200 ${isHighlighted ? 'bg-gray-50' : ''} ${canAdd ? 'cursor-pointer' : ''}`}
      style={{ height }}
      onMouseMove={canAdd ? showHint : undefined}
      onMouseLeave={canAdd ? () => setHoveredStart(null) : undefined}
      onClick={canAdd ? addMeetingHere : undefined}
    >
      <HourLines hours={hours} firstHour={firstHour} />

      {hoveredStart !== null && (
        <SlotHint start={hoveredStart} firstHour={firstHour} />
      )}

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
