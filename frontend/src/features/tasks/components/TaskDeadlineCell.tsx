import {
  DEADLINE_TONE_CLASSES,
  describeDeadline,
  INHERITED_DEADLINE_TITLE,
} from '../utils/formatDeadline';
import type { TaskRow } from '../data';

interface TaskDeadlineCellProps {
  row: TaskRow;
  today: string;
}

export default function TaskDeadlineCell({
  row,
  today,
}: TaskDeadlineCellProps) {
  if (!row.effectiveDueDate) {
    return <span className="text-xs text-mutedText">Bez terminu</span>;
  }

  const view = describeDeadline(row.effectiveDueDate, today, {
    isDone: row.status === 'DONE',
    isInherited: row.dueDate === null,
  });

  return (
    <div>
      <p
        className={`text-xs whitespace-nowrap text-dark ${
          view.isInherited ? 'italic' : ''
        }`}
        title={view.isInherited ? INHERITED_DEADLINE_TITLE : undefined}
      >
        {view.date}
      </p>
      <p
        className={`text-[11px] whitespace-nowrap ${DEADLINE_TONE_CLASSES[view.tone]}`}
      >
        {view.relative}
      </p>
    </div>
  );
}
