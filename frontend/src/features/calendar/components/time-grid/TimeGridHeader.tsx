import { WEEKDAY_SHORT_NAMES, formatFullDay } from '../../utils/calendarView';
import { dayNumber } from '../../utils/monthGrid';
import { GUTTER_CLASSES } from './layout';

interface TimeGridHeaderProps {
  days: string[];
  today: string;
  onDayClick: (day: string) => void;
}

function dayButtonClasses(isToday: boolean, isWeekend: boolean) {
  if (isToday) return 'bg-dark font-semibold text-white';
  if (isWeekend) return 'text-gray-400 hover:bg-gray-100';
  return 'text-gray-500 hover:bg-gray-100';
}

function GutterCaption() {
  return (
    <div
      className={`${GUTTER_CLASSES} flex items-center justify-center text-[11px] text-gray-400`}
    >
      godz.
    </div>
  );
}

export function TimeGridHeader({
  days,
  today,
  onDayClick,
}: TimeGridHeaderProps) {
  if (days.length === 1) {
    return (
      <div className="flex border-b border-gray-200">
        <GutterCaption />
        <p className="flex-1 border-l border-gray-200 py-3 text-center text-sm font-semibold text-dark">
          {formatFullDay(days[0])}
        </p>
      </div>
    );
  }

  return (
    <div className="flex border-b border-gray-200">
      <GutterCaption />
      {days.map((day, index) => (
        <div
          key={day}
          className={`flex flex-1 justify-center border-l border-gray-200 py-3 ${day === today ? 'bg-gray-50' : ''}`}
        >
          <button
            type="button"
            onClick={() => onDayClick(day)}
            aria-label={`Pokaż dzień: ${formatFullDay(day)}`}
            className={`cursor-pointer rounded-full px-3.5 py-1 text-[13px] transition-colors ${dayButtonClasses(day === today, index >= 5)}`}
          >
            {WEEKDAY_SHORT_NAMES[index]} {dayNumber(day)}
          </button>
        </div>
      ))}
    </div>
  );
}
