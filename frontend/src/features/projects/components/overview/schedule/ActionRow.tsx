import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../../../components/ui/ActionMenu';
import type { ScheduleAction, ScheduleTask } from '../../../types';
import { isTaskOverdue } from '../../../utils/scheduleState';
import ScheduleTaskRow from './ScheduleTaskRow';

interface ActionRowProps {
  action: ScheduleAction;
  ordinal: number;
  tasks: ScheduleTask[];
  isFiltered: boolean;
  stageDeadline: string;
  today: string;
  canEdit: boolean;
  canToggle: (task: ScheduleTask) => boolean;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
  onToggleTask: (taskId: string) => void;
}

export default function ActionRow({
  action,
  ordinal,
  tasks,
  isFiltered,
  stageDeadline,
  today,
  canEdit,
  canToggle,
  onEdit,
  onMove,
  onDelete,
  onToggleTask,
}: ActionRowProps) {
  const menuItems: ActionMenuItem[] = [
    { id: 'edit', label: 'Zmień nazwę', onSelect: onEdit },
    { id: 'move', label: 'Przenieś do etapu', onSelect: onMove },
    {
      id: 'delete',
      label: 'Usuń działanie',
      tone: 'danger',
      onSelect: onDelete,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-xs font-bold text-dark 800:text-sm">
          Działanie {ordinal} · {action.title}
        </p>
        {canEdit && (
          <ActionMenu
            items={menuItems}
            ariaLabel={`Opcje działania ${action.title}`}
            className="shrink-0"
          />
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="mt-1 py-2 text-xs text-mutedText">
          {isFiltered
            ? 'Brak zadań w wybranym oknie czasowym.'
            : 'To działanie nie ma jeszcze zadań — dodasz je w zakładce Zadania.'}
        </p>
      ) : (
        <ul className="mt-1 divide-y divide-gray-100">
          {tasks.map((task) => (
            <li key={task.id}>
              <ScheduleTaskRow
                task={task}
                fallbackDueDate={stageDeadline}
                isOverdue={isTaskOverdue(task, today)}
                canToggle={canToggle(task)}
                onToggle={() => onToggleTask(task.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
