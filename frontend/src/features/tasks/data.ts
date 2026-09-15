import type { BackendTaskRow } from '../../lib/projectsApi';
import type { Subtask, TaskPriority, TaskStatus } from '../projects/types';

export interface TaskRow {
  id: string;
  title: string;
  stageName: string;
  stageId: string;
  actionId: string;
  actionTitle: string;
  owner: string | null;
  ownerId: string | null;
  dueDate: string | null;
  effectiveDueDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  description: string;
  subtasks: Subtask[];
  createdAt: string | null;
  updatedAt: string | null;
}

function day(value: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}


export function mapBackendTask(task: BackendTaskRow): TaskRow {
  return {
    id: task.id,
    title: task.title,
    stageName: task.stage.name,
    stageId: task.stage.id,
    actionId: task.activityId,
    actionTitle: task.activity.name,
    owner: task.owner
      ? `${task.owner.firstName} ${task.owner.lastName}`.trim()
      : null,
    ownerId: task.owner?.id ?? null,
    dueDate: day(task.dueDate),
    effectiveDueDate: day(task.dueDate) ?? day(task.stage.deadline),
    status: task.status,
    priority: task.priority,
    description: task.description,
    subtasks: task.subtasks,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
