import type {
  ProjectSchedule,
  ScheduleAction,
  ScheduleTask,
} from '../types';

export interface TaskCounts {
  actions: number;
  total: number;
  done: number;
  started: number;
  pending: number;
}

export const EMPTY_COUNTS: TaskCounts = {
  actions: 0,
  total: 0,
  done: 0,
  started: 0,
  pending: 0,
};

export interface ScheduleIndex {
  actionsByStage: Map<string, ScheduleAction[]>;
  tasksByAction: Map<string, ScheduleTask[]>;
  actionById: Map<string, ScheduleAction>;
  stageIdByTask: Map<string, string>;
}

export function buildScheduleIndex(schedule: ProjectSchedule): ScheduleIndex {
  const actionsByStage = new Map<string, ScheduleAction[]>();
  const tasksByAction = new Map<string, ScheduleTask[]>();
  const actionById = new Map<string, ScheduleAction>();
  const stageIdByTask = new Map<string, string>();

  for (const action of schedule.actions) {
    actionById.set(action.id, action);

    const siblings = actionsByStage.get(action.stageId);
    if (siblings) siblings.push(action);
    else actionsByStage.set(action.stageId, [action]);
  }

  for (const task of schedule.tasks) {
    const siblings = tasksByAction.get(task.actionId);
    if (siblings) siblings.push(task);
    else tasksByAction.set(task.actionId, [task]);
    const action = actionById.get(task.actionId);
    if (action) stageIdByTask.set(task.id, action.stageId);
  }

  return { actionsByStage, tasksByAction, actionById, stageIdByTask };
}

export function actionsForStage(
  index: ScheduleIndex,
  stageId: string,
): ScheduleAction[] {
  return index.actionsByStage.get(stageId) ?? [];
}

export function tasksForAction(
  index: ScheduleIndex,
  actionId: string,
): ScheduleTask[] {
  return index.tasksByAction.get(actionId) ?? [];
}

export function tasksForStage(
  index: ScheduleIndex,
  stageId: string,
): ScheduleTask[] {
  return actionsForStage(index, stageId).flatMap((action) =>
    tasksForAction(index, action.id),
  );
}

export function countTasks(
  tasks: ScheduleTask[],
  actionCount: number,
): TaskCounts {
  const done = tasks.filter((task) => task.status === 'DONE').length;
  const started = tasks.filter((task) => task.status === 'IN_PROGRESS').length;

  return {
    actions: actionCount,
    total: tasks.length,
    done,
    started,
    pending: tasks.length - done,
  };
}

export function countsForStage(
  index: ScheduleIndex,
  stageId: string,
): TaskCounts {
  const actions = actionsForStage(index, stageId);
  return countTasks(
    actions.flatMap((action) => tasksForAction(index, action.id)),
    actions.length,
  );
}

export function isTaskOverdue(task: ScheduleTask, today: string): boolean {
  if (task.status === 'DONE' || !task.dueDate) return false;
  return task.dueDate < today;
}

export function overdueTasks(
  schedule: ProjectSchedule,
  today: string,
): ScheduleTask[] {
  return schedule.tasks
    .filter((task) => isTaskOverdue(task, today))
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''));
}
