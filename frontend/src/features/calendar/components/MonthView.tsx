import {
  endOfMonthIso,
  startOfMonthIso,
  todayIso,
} from '../../projects/utils/isoDate';
import { sampleMeetings } from '../sampleMeetings';
import {
  dayNumber,
  getMonthGridDays,
  monthCellMeetings,
} from '../utils/monthGrid';

const WEEK_DAYS = ['PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO', 'ND'];

export function MonthView({ anchor }: { anchor: string }) {
  const gridDays = getMonthGridDays(anchor);
  const today = todayIso();
  const firstDay = startOfMonthIso(anchor);
  const lastDay = endOfMonthIso(anchor);

  return (
    <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
      {WEEK_DAYS.map((day) => (
        <div
          key={day}
          className="bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-400"
        >
          {day}
        </div>
      ))}

      {gridDays.map((day) => {
        const { visibleMeetings, hiddenCount } = monthCellMeetings(
          sampleMeetings,
          day,
        );

        return (
          <div
            key={day}
            className={`h-28 p-2 text-sm overflow-hidden
            ${
              day < firstDay || day > lastDay
                ? 'bg-gray-50 text-gray-400'
                : 'bg-white text-dark'
            }`}
          >
            <span
              className={`inline-flex items-center justify-center h-7 w-7 rounded-full 
                ${
                  day === today ? 'bg-darkGreen font-semibold text-white' : ''
                }`}
            >
              {dayNumber(day)}
            </span>
            <div className="mt-1 flex flex-col gap-1">
              {visibleMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="text-xs py-0.5 px-2 rounded truncate bg-gray-100"
                >
                  <span>{`${meeting.startTime} ${meeting.title}`}</span>
                </div>
              ))}
              {hiddenCount > 0 && (
                <p className="px-1.5 text-xs text-gray-500">
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
