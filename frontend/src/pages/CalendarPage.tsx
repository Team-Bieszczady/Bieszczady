import { useState } from 'react';
import { formatMonthTitle } from '../features/calendar/utils/monthGrid';
import {
  addDaysIso,
  endOfMonthIso,
  startOfMonthIso,
  todayIso,
} from '../features/projects/utils/isoDate';
import { MonthView } from '../features/calendar/components/MonthView';
import { ProjectFilter } from '../features/calendar/components/ProjectFilter';
import { sampleProjects } from '../features/calendar/sampleProjects';
import { sampleMeetings } from '../features/calendar/sampleMeetings';

export default function CalendarPage() {
  const [anchor, setAnchor] = useState(todayIso);

  const [hiddenProjectIds, setHiddenProjectIds] = useState<string[]>([]);

  const toggleProject = (id: string) => {
    if (hiddenProjectIds.includes(id)) {
      setHiddenProjectIds((prev) => prev.filter((el) => el !== id));
    } else {
      setHiddenProjectIds((prev) => [...prev, id]);
    }
  };
  const filteredMeetings = sampleMeetings.filter(
    (meeting) => !hiddenProjectIds.includes(meeting.projectId),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 pb-4 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <h1 className="text-base font-bold text-dark min-[500px]:text-xl lg:text-2xl">
        Kalendarz
      </h1>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Poprzedni miesiąc"
            onClick={() =>
              setAnchor((prev) =>
                startOfMonthIso(addDaysIso(startOfMonthIso(prev), -1)),
              )
            }
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => setAnchor(todayIso())}
            className="h-8 cursor-pointer rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium hover:bg-gray-50"
          >
            Dzisiaj
          </button>

          <button
            type="button"
            aria-label="Następny miesiąc"
            onClick={() =>
              setAnchor((prev) => addDaysIso(endOfMonthIso(prev), 1))
            }
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
          >
            →
          </button>

          <p className="text-xl font-bold text-dark">
            {formatMonthTitle(anchor)}
          </p>
        </div>
        <ProjectFilter
          projects={sampleProjects}
          hiddenProjectIds={hiddenProjectIds}
          onToggle={toggleProject}
        />
      </div>
      <MonthView anchor={anchor} meetings={filteredMeetings} />
    </div>
  );
}
