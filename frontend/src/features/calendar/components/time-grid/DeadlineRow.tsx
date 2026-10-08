import type { CalendarProject, Deadline } from '../../types';
import { deadlinesOnDay } from '../../utils/monthGrid';
import { DeadlineChip } from '../DeadlineChip';
import { GUTTER_CLASSES } from './layout';

interface DeadlineRowProps {
  days: string[];
  deadlines: Deadline[];
  projects: CalendarProject[];
  today: string;
  onDeadlineClick: (deadline: Deadline) => void;
}

export function DeadlineRow({
  days,
  deadlines,
  projects,
  today,
  onDeadlineClick,
}: DeadlineRowProps) {
  const isSingleDay = days.length === 1;
  const cellPadding = isSingleDay ? 'p-2' : 'p-1';

  if (!days.some((day) => deadlinesOnDay(deadlines, day).length > 0)) {
    return null;
  }

  const projectOf = (deadline: Deadline) =>
    projects.find((project) => project.id === deadline.projectId);

  return (
    <div className="flex border-b border-gray-200">
      <div className={`${GUTTER_CLASSES} ${cellPadding}`}>
        <p
          className={`flex items-center justify-center text-[11px] text-gray-400 ${isSingleDay ? 'h-7' : 'h-6'}`}
        >
          terminy
        </p>
      </div>

      {days.map((day) => (
        <div
          key={day}
          className={`flex min-w-0 flex-1 flex-col gap-1 border-l border-gray-200 ${cellPadding} ${!isSingleDay && day === today ? 'bg-gray-50' : ''}`}
        >
          {deadlinesOnDay(deadlines, day).map((deadline) => (
            <DeadlineChip
              key={deadline.id}
              deadline={deadline}
              project={projectOf(deadline)}
              size={isSingleDay ? 'day' : 'week'}
              onClick={() => onDeadlineClick(deadline)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
