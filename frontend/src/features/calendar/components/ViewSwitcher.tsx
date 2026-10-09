import type { CalendarView } from '../utils/calendarView';

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Dzień' },
  { value: 'week', label: 'Tydzień' },
  { value: 'month', label: 'Miesiąc' },
];

interface ViewSwitcherProps {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
  stretch?: boolean;
}

export function ViewSwitcher({
  value,
  onChange,
  stretch = false,
}: ViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Widok kalendarza"
      className={`rounded-lg bg-gray-100 p-1 ${stretch ? 'grid flex-1 grid-cols-3' : 'inline-flex'}`}
    >
      {VIEWS.map((view) => {
        const isActive = view.value === value;

        return (
          <button
            key={view.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(view.value)}
            className={`h-7 cursor-pointer rounded-md px-4 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-darkGreen text-white'
                : 'text-dark/70 hover:text-dark'
            }`}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
}
