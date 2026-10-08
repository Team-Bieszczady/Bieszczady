import { todayIso } from '../../projects/utils/isoDate';
import { meetingColors } from '../meetingColors';
import type { CalendarProject, Deadline, Meeting } from '../types';
import { WEEKDAY_SHORT_NAMES, formatFullDay } from '../utils/calendarView';
import {
  dayNumber,
  dayNumberClasses,
  deadlinesOnDay,
  meetingsOnDay,
} from '../utils/monthGrid';
import { DeadlineChip } from './DeadlineChip';

interface WeekAgendaProps {
  days: string[];
  meetings: Meeting[];
  deadlines: Deadline[];
  projects: CalendarProject[];
  onMeetingClick: (meetingId: string) => void;
  onDeadlineClick: (deadline: Deadline) => void;
  onDayClick: (day: string) => void;
}

interface AgendaMeetingProps {
  meeting: Meeting;
  project: CalendarProject | undefined;
  onClick: () => void;
}

function AgendaMeeting({ meeting, project, onClick }: AgendaMeetingProps) {
  const colors = meetingColors(project?.color);
  const isCancelled = meeting.status === 'CANCELLED';
  const time = `${meeting.startTime} – ${meeting.endTime}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full cursor-pointer rounded-r-lg py-2 pr-2 pl-3 text-left text-dark active:brightness-95 ${colors.tint} ${isCancelled ? 'line-through opacity-60' : ''}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 rounded-full ${colors.accent}`}
      />
      <p className="truncate text-sm leading-snug font-semibold">
        {meeting.status === 'HELD' ? `✓ ${meeting.title}` : meeting.title}
      </p>
      <p className="mt-0.5 truncate text-xs text-gray-500">
        {meeting.place ? `${time}, ${meeting.place}` : time}
      </p>
    </button>
  );
}

export function WeekAgenda({
  days,
  meetings,
  deadlines,
  projects,
  onMeetingClick,
  onDeadlineClick,
  onDayClick,
}: WeekAgendaProps) {
  const today = todayIso();

  const projectOf = (entry: { projectId: string }) =>
    projects.find((project) => project.id === entry.projectId);

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white font-calendar">
      {days.map((day, index) => {
        const isToday = day === today;
        const dayDeadlines = deadlinesOnDay(deadlines, day);
        const dayMeetings = meetingsOnDay(meetings, day);
        const isEmpty = dayDeadlines.length === 0 && dayMeetings.length === 0;

        return (
          <section
            key={day}
            aria-label={formatFullDay(day)}
            className={`flex gap-3 p-3 ${isToday ? 'bg-gray-50' : ''}`}
          >
            <button
              type="button"
              onClick={() => onDayClick(day)}
              aria-label={`Pokaż dzień: ${formatFullDay(day)}`}
              className="flex w-9 shrink-0 cursor-pointer flex-col items-center gap-0.5"
            >
              <span
                className={`text-[11px] ${index >= 5 ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {WEEKDAY_SHORT_NAMES[index]}
              </span>
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${dayNumberClasses(isToday, index >= 5)}`}
              >
                {dayNumber(day)}
              </span>
            </button>

            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {isEmpty && (
                <p className="pt-5 text-xs text-gray-400">
                  Nic nie zaplanowano
                </p>
              )}
              {dayDeadlines.map((deadline) => (
                <DeadlineChip
                  key={deadline.id}
                  deadline={deadline}
                  project={projectOf(deadline)}
                  size="week"
                  onClick={() => onDeadlineClick(deadline)}
                />
              ))}
              {dayMeetings.map((meeting) => (
                <AgendaMeeting
                  key={meeting.id}
                  meeting={meeting}
                  project={projectOf(meeting)}
                  onClick={() => onMeetingClick(meeting.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
