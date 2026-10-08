import {
  endOfMonthIso,
  startOfMonthIso,
  todayIso,
} from '../../projects/utils/isoDate';
import { meetingColorClass } from '../meetingColors';
import { WEEKDAY_SHORT_NAMES } from '../utils/calendarView';
import type { CalendarProject, Meeting } from '../types';
import {
  dayNumber,
  getMonthGridDays,
  monthCellMeetings,
} from '../utils/monthGrid';

interface Props {
  anchor: string;
  meetings: Meeting[];
  projects: CalendarProject[];
  onMeetingClick: (meetingId: string) => void;
  onDayClick: (day: string) => void;
}

export function MonthView({
  anchor,
  meetings,
  projects,
  onMeetingClick,
  onDayClick,
}: Props) {
  const gridDays = getMonthGridDays(anchor);
  const today = todayIso();
  const firstDay = startOfMonthIso(anchor);
  const lastDay = endOfMonthIso(anchor);

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
      {WEEKDAY_SHORT_NAMES.map((day, index) => (
        <div
          key={day}
          className={`bg-white py-2 text-center text-xs font-medium ${
            index >= 5 ? 'text-gray-400' : 'text-dark/70'
          }`}
        >
          {day}
        </div>
      ))}

      {gridDays.map((day, index) => {
        const { visibleMeetings, hiddenCount } = monthCellMeetings(
          meetings,
          day,
        );
        const isOutsideMonth = day < firstDay || day > lastDay;
        const isWeekend = index % 7 === 5 || index % 7 === 6;
        const background = isOutsideMonth ? 'bg-gray-50' : 'bg-white';
        const textColor =
          isOutsideMonth || isWeekend ? 'text-gray-400' : 'text-dark';
        return (
          <div
            key={day}
            className={`h-28 overflow-hidden p-2 text-xs ${background} ${textColor}`}
          >
            <button
              type="button"
              onClick={() => onDayClick(day)}
              aria-label={`Pokaż dzień ${day}`}
              className={`inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-colors ${
                day === today
                  ? 'bg-dark font-semibold text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {dayNumber(day)}
            </button>
            <div className="mt-1 flex flex-col gap-1">
              {visibleMeetings.map((meeting) => {
                const project = projects.find(
                  (el) => el.id === meeting.projectId,
                );

                return (
                  <button
                    key={meeting.id}
                    type="button"
                    onClick={() => onMeetingClick(meeting.id)}
                    title={
                      meeting.status === 'CANCELLED'
                        ? 'Spotkanie odwołane'
                        : undefined
                    }
                    className={`h-5 w-full cursor-pointer truncate rounded border-l-2 px-1.5 text-left text-[11px] leading-5 font-medium text-dark hover:brightness-95 ${meetingColorClass(project?.color)} ${
                      meeting.status === 'CANCELLED'
                        ? 'line-through opacity-60'
                        : ''
                    }`}
                  >
                    {`${meeting.status === 'HELD' ? '✓ ' : ''}${meeting.startTime} ${meeting.title}`}
                  </button>
                );
              })}
              {hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => onDayClick(day)}
                  className="cursor-pointer pl-2 text-left text-[11px] font-medium text-grayText hover:text-dark"
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
