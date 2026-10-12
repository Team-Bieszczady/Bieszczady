import type {
  StageDeleteStrategy,
  TaskPriorityValue,
  TaskStatusValue,
} from '../../lib/projectsApi';

export type StageStatus = 'planned' | 'in_progress' | 'completed';

export interface Stage {
  id: string;
  name: string;
  description: string;
  startDate: string | null;
  deadline: string;
  originalDeadline: string | null;
  deadlineNote: string | null;
  completedAt: string | null;
  archivedAt: string | null;
}

export interface ScheduleAction {
  id: string;
  stageId: string;
  title: string;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
}

export interface ScheduleTask {
  id: string;
  actionId: string;
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: string | null;
  owner: string | null;
  ownerId: string | null;
}

export interface ProjectSchedule {
  actions: ScheduleAction[];
  tasks: ScheduleTask[];
}

export interface StageFormValues {
  name: string;
  description: string;
  startDate: string | null;
  deadline: string;
}

export type StageEditValues = Pick<StageFormValues, 'name' | 'description'>;

export interface ActionFormValues {
  title: string;
  stageId: string;
}

export interface TaskFormValues {
  title: string;
  actionId: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: string | null;
  ownerId: string | null;
  description: string;
}

export type DeleteStrategy =
  | { kind: Exclude<StageDeleteStrategy, 'move'> }
  | { kind: 'move'; targetStageId: string };
