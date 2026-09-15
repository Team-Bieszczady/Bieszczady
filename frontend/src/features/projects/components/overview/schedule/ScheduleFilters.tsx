import { FiCheckSquare, FiSquare } from 'react-icons/fi';
import {
  SCHEDULE_PERIODS,
  type SchedulePeriod,
} from '../../../utils/schedulePeriod';

interface ScheduleFiltersProps {
  period: SchedulePeriod;
  onlyUndone: boolean;
  onPeriodChange: (period: SchedulePeriod) => void;
  onOnlyUndoneChange: (value: boolean) => void;
}

export default function ScheduleFilters({
  period,
  onlyUndone,
  onPeriodChange,
  onOnlyUndoneChange,
}: ScheduleFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div
        role="group"
        aria-label="Zakres harmonogramu"
        className="flex w-full max-w-sm gap-2 800:w-auto 800:max-w-none 800:gap-2.5"
      >
        {SCHEDULE_PERIODS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={period === option.id}
            onClick={() => onPeriodChange(option.id)}
            className={`inline-flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg px-4 text-xs font-medium whitespace-nowrap transition-colors max-lg:h-7 max-lg:px-3 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none 800:flex-none ${
              period === option.id
                ? 'bg-darkGreen text-white'
                : 'border border-gray-200 bg-white text-dark hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-pressed={onlyUndone}
        onClick={() => onOnlyUndoneChange(!onlyUndone)}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded-md text-xs text-dark focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none 800:ml-1 800:w-auto"
      >
        {onlyUndone ? (
          <FiCheckSquare
            className="h-4 w-4 shrink-0 text-darkGreen"
            aria-hidden="true"
          />
        ) : (
          <FiSquare
            className="h-4 w-4 shrink-0 text-trackGray"
            aria-hidden="true"
          />
        )}
        Tylko niezrobione
      </button>
    </div>
  );
}
