import { TASK_STATUS_LABELS } from '../../projects/labels';
import type { TaskStatus } from '../../projects/types';

const TONE: Record<TaskStatus, string> = {
  NEW: 'bg-gray-100 text-grayText',
  IN_PROGRESS: 'bg-lightGreen text-darkGreen',
  BLOCKED: 'bg-redSoft text-darkRed',
  DONE: 'bg-gray-200 text-gray-600',
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
