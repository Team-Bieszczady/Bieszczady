import type { ScheduleTask } from '../../../types';
import { formatShortDate } from '../../../utils/isoDate';
import { shortName } from '../../../utils/shortName';
import { TaskIcon } from './ScheduleTaskRow';

interface OverdueListProps {
  tasks: ScheduleTask[];
  actionTitle: (task: ScheduleTask) => string;
  canToggle: (task: ScheduleTask) => boolean;
  onToggle: (taskId: string) => void;
}

export default function OverdueList({
  tasks,
  actionTitle,
  canToggle,
  onToggle,
}: OverdueListProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="800:mt-6">
      <p className="text-xs font-semibold tracking-[0.5px] text-darkRed">
        ZALEGŁE
      </p>

      <ul className="mt-3 flex flex-col gap-3 800:mt-1 800:block 800:divide-y 800:divide-gray-100">
        {tasks.map((task) => {
          const row = (
            <>
              <TaskIcon task={task} />
              <span className="min-w-0 text-xs text-dark 800:text-sm">
                {task.title}
              </span>
              <span className="text-xs text-grayText">
                · {actionTitle(task)}
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                <span className="text-xs text-grayText">
                  termin {task.dueDate && formatShortDate(task.dueDate)}
                  {task.owner && ` · ${shortName(task.owner)}`}
                </span>
                <span className="inline-flex items-center rounded-full bg-redSoft px-2.5 py-0.5 text-[11px] font-medium text-darkRed">
                  po terminie
                </span>
              </span>
            </>
          );

          return (
            <li key={task.id}>
              {canToggle(task) ? (
                <button
                  type="button"
                  onClick={() => onToggle(task.id)}
                  aria-label={`Zmień stan zaległego zadania: ${task.title}`}
                  className="flex w-full cursor-pointer flex-wrap items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none 800:rounded-none 800:border-0 800:p-0 800:py-2.5"
                >
                  {row}
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-4 800:rounded-none 800:border-0 800:p-0 800:py-2.5">
                  {row}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
