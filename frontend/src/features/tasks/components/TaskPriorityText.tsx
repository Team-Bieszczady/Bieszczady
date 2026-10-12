import { TASK_PRIORITY_LABELS } from '../../projects/labels';
import type { TaskPriorityValue } from '../../../lib/projectsApi';

const PRIORITY_CLASSES: Record<TaskPriorityValue, string> = {
  HIGH: 'text-darkRed',
  MEDIUM: 'text-amberDark',
  LOW: 'text-grayText',
};

interface TaskPriorityTextProps {
  priority: TaskPriorityValue;
}

export default function TaskPriorityText({ priority }: TaskPriorityTextProps) {
  return (
    <span className={`text-sm font-medium ${PRIORITY_CLASSES[priority]}`}>
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  );
}
