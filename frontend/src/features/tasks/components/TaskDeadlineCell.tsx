import {
  DEADLINE_TONE_CLASSES,
  describeDeadline,
} from '../utils/formatDeadline';
import type { TaskRow } from '../data';

interface TaskDeadlineCellProps {
  row: TaskRow;
  today: string;
  align?: 'left' | 'right';
}

export default function TaskDeadlineCell({
  row,
  today,
  align = 'left',
}: TaskDeadlineCellProps) {
  if (!row.effectiveDueDate) {
    return <span className="text-xs text-mutedText">Bez terminu</span>;
  }

  const view = describeDeadline(row.effectiveDueDate, today, {
    isDone: row.status === 'DONE',
    isInherited: row.dueDate === null,
  });

  return (
    <div className={align === 'right' ? 'text-right' : ''}>
      <p
        className={`text-xs whitespace-nowrap text-dark ${
          view.isInherited ? 'italic' : ''
        }`}
        title={
          view.isInherited
            ? 'Zadanie bez własnego terminu — obowiązuje termin etapu'
            : undefined
        }
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
