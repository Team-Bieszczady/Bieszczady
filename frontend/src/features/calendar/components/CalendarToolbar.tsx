import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { formatViewTitle, type CalendarView } from '../utils/calendarView';
import { ViewSwitcher } from './ViewSwitcher';

const PREVIOUS_LABELS: Record<CalendarView, string> = {
  day: 'Poprzedni dzień',
  week: 'Poprzedni tydzień',
  month: 'Poprzedni miesiąc',
};

const NEXT_LABELS: Record<CalendarView, string> = {
  day: 'Następny dzień',
  week: 'Następny tydzień',
  month: 'Następny miesiąc',
};

const NAV_BUTTON_CLASSES =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50';

const TODAY_BUTTON_CLASSES =
  'h-8 shrink-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium hover:bg-gray-50';

interface CalendarToolbarProps {
  view: CalendarView;
  anchor: string;
  compact: boolean;
  onShift: (step: -1 | 1) => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

export function CalendarToolbar({
  view,
  anchor,
  compact,
  onShift,
  onToday,
  onViewChange,
}: CalendarToolbarProps) {
  const previousButton = (
    <button
      type="button"
      aria-label={PREVIOUS_LABELS[view]}
      onClick={() => onShift(-1)}
      className={NAV_BUTTON_CLASSES}
    >
      <LuChevronLeft size={16} />
    </button>
  );

  const nextButton = (
    <button
      type="button"
      aria-label={NEXT_LABELS[view]}
      onClick={() => onShift(1)}
      className={NAV_BUTTON_CLASSES}
    >
      <LuChevronRight size={16} />
    </button>
  );

  const todayButton = (
    <button type="button" onClick={onToday} className={TODAY_BUTTON_CLASSES}>
      Dzisiaj
    </button>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {previousButton}
          <p className="flex-1 text-center text-base font-bold text-dark">
            {formatViewTitle(view, anchor)}
          </p>
          {nextButton}
        </div>
        <div className="flex items-center gap-3">
          {todayButton}
          <ViewSwitcher value={view} onChange={onViewChange} stretch />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {previousButton}
        {todayButton}
        {nextButton}
        <p className="text-xl font-bold text-dark">
          {formatViewTitle(view, anchor)}
        </p>
      </div>
      <ViewSwitcher value={view} onChange={onViewChange} />
    </div>
  );
}
