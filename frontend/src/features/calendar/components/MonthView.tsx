import {
  endOfMonthIso,
  startOfMonthIso,
  todayIso,
} from '../../projects/utils/isoDate';
import { meetingColors } from '../meetingColors';
import type { CalendarProject, Deadline, Meeting } from '../types';
import { WEEKDAY_SHORT_NAMES } from '../utils/calendarView';
import {
  dayNumber,
  getMonthGridDays,
  monthCellEntries,
} from '../utils/monthGrid';
import { DeadlineChip } from './DeadlineChip';

interface Props {
  anchor: string;
  meetings: Meeting[];
  deadlines: Deadline[];
  projects: CalendarProject[];
  onMeetingClick: (meetingId: string) => void;
  onDeadlineClick: (deadline: Deadline) => void;
  onDayClick: (day: string) => void;
}

function dayNumberClasses(isToday: boolean, isMuted: boolean) {
  if (isToday) return 'bg-dark font-semibold text-white';
  if (isMuted) return 'text-gray-400 hover:bg-gray-100';
  return 'text-dark hover:bg-gray-100';
}

interface MeetingChipProps {
  meeting: Meeting;
  project: CalendarProject | undefined;
  onClick: () => void;
}

function MeetingChip({ meeting, project, onClick }: MeetingChipProps) {
  const colors = meetingColors(project?.color);
  const isCancelled = meeting.status === 'CANCELLED';
  const prefix = meeting.status === 'HELD' ? '✓ ' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      title={isCancelled ? 'Spotkanie odwołane' : undefined}
      className={`relative h-5 w-full cursor-pointer truncate rounded-r pr-1.5 pl-2.5 text-left text-[11px] leading-5 text-dark hover:brightness-95 ${colors.tint} ${
        isCancelled ? 'line-through opacity-60' : ''
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-0.75 rounded-full ${colors.accent}`}
      />
      {`${prefix}${meeting.startTime} ${meeting.title}`}
    </button>
  );
}

export function MonthView({
  anchor,
  meetings,
  deadlines,
  projects,
  onMeetingClick,
  onDeadlineClick,
  onDayClick,
}: Props) {
  const gridDays = getMonthGridDays(anchor);
  const today = todayIso();
  const firstDay = startOfMonthIso(anchor);
  const lastDay = endOfMonthIso(anchor);

  const projectOf = (entry: { projectId: string }) =>
    projects.find((project) => project.id === entry.projectId);

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 font-calendar">
      {WEEKDAY_SHORT_NAMES.map((day, index) => (
        <div
          key={day}
          className={`bg-white py-2.5 text-center text-[13px] ${
            index >= 5 ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {day}
        </div>
      ))}

      {gridDays.map((day, index) => {
        const { visibleDeadlines, visibleMeetings, hiddenCount } =
          monthCellEntries(meetings, deadlines, day);
        const isToday = day === today;
        const isOutsideMonth = day < firstDay || day > lastDay;
        const isWeekend = index % 7 === 5 || index % 7 === 6;

        return (
          <div
            key={day}
            className={`h-28 overflow-hidden p-2 text-xs ${isToday ? 'bg-gray-50' : 'bg-white'}`}
          >
            <button
              type="button"
              onClick={() => onDayClick(day)}
              aria-label={`Pokaż dzień ${day}`}
              className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-colors ${dayNumberClasses(isToday, isOutsideMonth || isWeekend)}`}
            >
              {dayNumber(day)}
            </button>
            <div className="mt-1 flex flex-col gap-1">
              {visibleDeadlines.map((deadline) => (
                <DeadlineChip
                  key={deadline.id}
                  deadline={deadline}
                  project={projectOf(deadline)}
                  size="month"
                  onClick={() => onDeadlineClick(deadline)}
                />
              ))}
              {visibleMeetings.map((meeting) => (
                <MeetingChip
                  key={meeting.id}
                  meeting={meeting}
                  project={projectOf(meeting)}
                  onClick={() => onMeetingClick(meeting.id)}
                />
              ))}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="cursor-pointer pl-2 text-left text-[11px] text-gray-500 hover:text-dark"
                >
                  +{hiddenCount} więcej
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
