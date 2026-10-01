import { useState } from 'react';
import { formatMonthTitle } from '../features/calendar/utils/monthGrid';
import {
  addDaysIso,
  endOfMonthIso,
  startOfMonthIso,
  todayIso,
} from '../features/projects/utils/isoDate';
import { MonthView } from '../features/calendar/components/MonthView';

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(todayIso);


  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 pb-4 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <h1 className="text-base font-bold text-dark min-[500px]:text-xl lg:text-2xl">
        Kalendarz
      </h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Poprzedni miesiąc"
          onClick={() =>
            setAnchor((prev) =>
              startOfMonthIso(addDaysIso(startOfMonthIso(prev), -1)),
            )
          }
        >
          ←
        </button>

        <button type="button" onClick={() => setAnchor(todayIso())}>
          Dzisiaj
        </button>

        <button
          type="button"
          aria-label="Następny miesiąc"
          onClick={() =>
            setAnchor((prev) => addDaysIso(endOfMonthIso(prev), 1))
          }
        >
          →
        </button>

        <p className="text-lg font-semibold text-dark">
          {formatMonthTitle(anchor)}
        </p>

      </div>
      {<MonthView anchor={anchor}/>}
    </div>
  );
}
