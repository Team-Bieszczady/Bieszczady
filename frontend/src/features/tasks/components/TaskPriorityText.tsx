import { TASK_PRIORITY_LABELS } from '../../projects/labels';
import type { TaskPriority } from '../../projects/types';

const PRIORITY_CLASSES: Record<TaskPriority, string> = {
  HIGH: 'text-darkRed',
  MEDIUM: 'text-amberDark',
  LOW: 'text-grayText',
};

interface TaskPriorityTextProps {
  priority: TaskPriority;
  className?: string;
}

export default function TaskPriorityText({
  priority,
  className = '',
}: TaskPriorityTextProps) {
  return (
    <span
      className={`text-sm font-medium ${PRIORITY_CLASSES[priority]} ${className}`}
    >
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}
