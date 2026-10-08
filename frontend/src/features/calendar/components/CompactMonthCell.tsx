import {
  MEETING_FORMS,
  pluralizePl,
  type PluralForms,
} from '../../../lib/pluralizePl';
import { meetingColors } from '../meetingColors';
import type { CalendarProject, Deadline, Meeting } from '../types';
import { formatFullDay } from '../utils/calendarView';
import {
  dayNumber,
  dayNumberClasses,
  deadlinesOnDay,
  meetingsOnDay,
} from '../utils/monthGrid';

const MAX_DOTS = 3;

const DEADLINE_FORMS: PluralForms = ['termin', 'terminy', 'terminów'];

interface CompactMonthCellProps {
  day: string;
  meetings: Meeting[];
  deadlines: Deadline[];
  projects: CalendarProject[];
  isToday: boolean;
  isMuted: boolean;
  onDayClick: (day: string) => void;
}

function describeDay(day: string, meetingCount: number, deadlineCount: number) {
  const parts = [formatFullDay(day)];
  if (meetingCount > 0) parts.push(pluralizePl(meetingCount, MEETING_FORMS));
  if (deadlineCount > 0) parts.push(pluralizePl(deadlineCount, DEADLINE_FORMS));
  return parts.join(', ');
}

export function CompactMonthCell({
  day,
  meetings,
  deadlines,
  projects,
  isToday,
  isMuted,
  onDayClick,
}: CompactMonthCellProps) {
  const dayDeadlines = deadlinesOnDay(deadlines, day);
  const dayMeetings = meetingsOnDay(meetings, day);

  const colorsOf = (projectId: string) =>
    meetingColors(projects.find((project) => project.id === projectId)?.color);

  const dots = [
    ...dayDeadlines.map(({ id, projectId }) => ({
      id,
      classes: `border-[1.5px] ${colorsOf(projectId).border}`,
    })),
    ...dayMeetings.map(({ id, projectId }) => ({
      id,
      classes: colorsOf(projectId).accent,
    })),
  ];

  return (
    <button
      type="button"
      onClick={() => onDayClick(day)}
      aria-label={describeDay(day, dayMeetings.length, dayDeadlines.length)}
      className={`flex h-16 cursor-pointer flex-col items-center gap-1.5 pt-1.5 active:bg-gray-100 ${isToday ? 'bg-gray-50' : 'bg-white'}`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${dayNumberClasses(isToday, isMuted)}`}
      >
        {dayNumber(day)}
      </span>
      {dots.length > 0 && (
        <span aria-hidden="true" className="flex items-center gap-1">
          {dots.slice(0, MAX_DOTS).map((dot) => (
            <span
              key={dot.id}
              className={`h-1.5 w-1.5 rounded-full ${dot.classes}`}
            />
          ))}
          {dots.length > MAX_DOTS && (
            <span className="text-[10px] leading-none text-gray-500">+</span>
          )}
        </span>
      )}
    </button>
  );
}
