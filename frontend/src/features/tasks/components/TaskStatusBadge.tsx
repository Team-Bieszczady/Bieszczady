import { TASK_STATUS_LABELS } from '../../projects/labels';
import type { TaskStatus } from '../../projects/types';

const TONE: Record<TaskStatus, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amberSoft text-amberDark',
  BLOCKED: 'bg-redSoft text-darkRed',
  DONE: 'bg-lightGreen text-darkGreen',
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export default function TaskStatusBadge({
  status,
  className = '',
}: TaskStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${TONE[status]} ${className}`}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}
