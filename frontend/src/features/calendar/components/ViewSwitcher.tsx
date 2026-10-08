import type { CalendarView } from '../utils/calendarView';

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Dzień' },
  { value: 'week', label: 'Tydzień' },
  { value: 'month', label: 'Miesiąc' },
];

interface ViewSwitcherProps {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <div
      role="group"
      aria-label="Widok kalendarza"
      className="inline-flex rounded-lg bg-gray-100 p-1"
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
