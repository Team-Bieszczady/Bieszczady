import {
  endOfMonthIso,
  startOfMonthIso,
  todayIso,
} from '../../projects/utils/isoDate';
import { MEETING_COLORS } from '../meetingColors';
import type { CalendarProject, Meeting } from '../types';
import {
  dayNumber,
  getMonthGridDays,
  monthCellMeetings,
} from '../utils/monthGrid';

const WEEK_DAYS = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND'];

interface Props {
  anchor: string;
  meetings: Meeting[];
  projects: CalendarProject[];
}

export function MonthView({ anchor, meetings, projects }: Props) {
  const gridDays = getMonthGridDays(anchor);
  const today = todayIso();
  const firstDay = startOfMonthIso(anchor);
  const lastDay = endOfMonthIso(anchor);

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
      {WEEK_DAYS.map((day) => (
        <div
          key={day}
          className="bg-gray-50 px-2 py-2 text-xs font-semibold tracking-wide text-gray-400"
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
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${day === today ? 'bg-darkGreen font-semibold text-white' : ''}`}
            >
              {dayNumber(day)}
            </span>
            <div className="mt-1 flex flex-col gap-1">
              {visibleMeetings.map((meeting) => {
                const project = projects.find(
                  (el) => el.id === meeting.projectId,
                );
                const colorClass =
                  MEETING_COLORS.find((el) => el.id === project?.color)
                    ?.className ?? 'border-gray-400 bg-gray-100';

                return (
                  <div
                    key={meeting.id}
                    className={`h-5 truncate rounded border-l-2 px-1.5 text-[11px] font-medium leading-5 text-dark ${colorClass}`}
                  >
                    <span>{`${meeting.startTime} ${meeting.title}`}</span>
                  </div>
                );
              })}
              {hiddenCount > 0 && (
                <p className="pl-2 text-[11px] font-medium text-grayText">
                  +{hiddenCount} więcej
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
