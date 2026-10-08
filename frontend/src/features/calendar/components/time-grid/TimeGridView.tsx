import { todayIso } from '../../../projects/utils/isoDate';
import { useNow } from '../../hooks/useNow';
import type { CalendarProject, Meeting } from '../../types';
import { meetingsOnDay } from '../../utils/monthGrid';
import {
  gridHeight,
  hoursBetween,
  nowMarker,
  visibleHours,
} from '../../utils/timeGrid';
import { DayColumn } from './DayColumn';
import { HourGutter } from './HourGutter';
import { TimeGridHeader } from './TimeGridHeader';

interface TimeGridViewProps {
  days: string[];
  meetings: Meeting[];
  projects: CalendarProject[];
  onMeetingClick: (meetingId: string) => void;
  onDayClick: (day: string) => void;
}

export function TimeGridView({
  days,
  meetings,
  projects,
  onMeetingClick,
  onDayClick,
}: TimeGridViewProps) {
  const currentTime = useNow();
  const today = todayIso(currentTime);
  const isSingleDay = days.length === 1;

  const shownMeetings = meetings.filter((meeting) =>
    days.includes(meeting.date),
  );
  const { first, last } = visibleHours(shownMeetings);
  const hours = hoursBetween(first, last);
  const height = gridHeight(first, last);
  const now = days.includes(today) ? nowMarker(currentTime, first, last) : null;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <div className={isSingleDay ? '' : 'min-w-180'}>
        <TimeGridHeader days={days} today={today} onDayClick={onDayClick} />

        <div className="flex">
          <HourGutter
            hours={hours}
            firstHour={first}
            height={height}
            now={now}
          />
          {days.map((day) => (
            <DayColumn
              key={day}
              meetings={meetingsOnDay(shownMeetings, day)}
              projects={projects}
              hours={hours}
              firstHour={first}
              height={height}
              isHighlighted={!isSingleDay && day === today}
              nowTop={day === today && now ? now.top : null}
              detailed={isSingleDay}
              onMeetingClick={onMeetingClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
