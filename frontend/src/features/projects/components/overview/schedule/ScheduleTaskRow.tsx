import { FiCheckSquare, FiSquare } from 'react-icons/fi';
import type { ScheduleTask } from '../../../types';
import { formatShortDate } from '../../../utils/isoDate';
import { shortName } from '../../../utils/shortName';

interface ScheduleTaskRowProps {
  task: ScheduleTask;
  fallbackDueDate: string;
  isOverdue: boolean;
  canToggle: boolean;
  onToggle: () => void;
}

export function TaskIcon({ task }: { task: ScheduleTask }) {
  return task.status === 'DONE' ? (
    <FiCheckSquare
      className="h-4 w-4 shrink-0 text-darkGreen"
      aria-hidden="true"
    />
  ) : (
    <FiSquare className="h-4 w-4 shrink-0 text-trackGray" aria-hidden="true" />
  );
}

function OverdueBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-redSoft px-2.5 py-0.5 text-[11px] font-medium text-darkRed">
      po terminie
    </span>
  );
}

function BlockedBadge() {
  return (
    <span className="text-[10px] font-semibold tracking-[0.3px] text-darkRed">
      ZABLOKOWANE
    </span>
  );
}

export default function ScheduleTaskRow({
  task,
  fallbackDueDate,
  isOverdue,
  canToggle,
  onToggle,
}: ScheduleTaskRowProps) {
  const dueDate = task.dueDate ?? fallbackDueDate;
  const isDone = task.status === 'DONE';

  const body = (
    <>
      <TaskIcon task={task} />
      <span
        className={`text-xs 800:text-sm ${isDone ? 'text-grayText' : 'text-dark'}`}
      >
        {task.title}
      </span>
      {task.status === 'BLOCKED' && <BlockedBadge />}
      {isOverdue && <OverdueBadge />}

      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs">
        <span
          title={
            task.dueDate === null
              ? 'Zadanie bez własnego terminu — obowiązuje termin etapu'
              : undefined
          }
          className={
            task.dueDate === null ? 'text-mutedText italic' : 'text-grayText'
          }
        >
          do {formatShortDate(dueDate)}
        </span>
        {task.owner && (
          <span className="text-grayText" title={task.owner}>
            · {shortName(task.owner)}
          </span>
        )}
      </span>
    </>
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5 py-2.5">
      {canToggle ? (
        <button
          type="button"
          role="checkbox"
          aria-checked={isDone}
          onClick={onToggle}
          aria-label={task.title}
          className="-mx-2 flex min-w-0 flex-1 cursor-pointer flex-wrap items-center gap-2.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-gray-50 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
        >
          {body}
        </button>
      ) : (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5 py-1">
          {body}
        </div>
      )}
    </div>
  );
}
