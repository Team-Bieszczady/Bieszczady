import { useApiMutation } from '../../../hooks/useApiMutation';
import { useApiQuery } from '../../../hooks/useApiQuery';
import {
  projectKeys,
  projectLists,
} from '../../projects/hooks/useProjectsApi';
import {
  subtasksApi,
  tasksApi,
  type CreateTaskPayload,
  type TaskStatusValue,
  type UpdateTaskPayload,
} from '../../../lib/projectsApi';

export const taskKeys = {
  list: (projectId: string, archived: boolean) =>
    ['tasks', projectId, { archived }] as const,
  mine: (projectId: string, archived: boolean) =>
    ['my-tasks', projectId, { archived }] as const,
  listFor: (projectId: string) => ['tasks', projectId] as const,
  mineFor: (projectId: string) => ['my-tasks', projectId] as const,
  detail: (id: string) => ['task', id] as const,
  subtasks: (taskId: string) => ['subtasks', taskId] as const,
};

function taskWriteKeys(projectId: string) {
  return [
    taskKeys.listFor(projectId),
    taskKeys.mineFor(projectId),
    projectKeys.stagesFor(projectId),
    ...projectLists,
  ];
}


export function useTasks(projectId: string, archived = false, enabled = true) {
  return useApiQuery(
    taskKeys.list(projectId, archived),
    (token) => tasksApi.list(token, projectId, { archived }),
    { enabled },
  );
}

export function useMyTasks(
  projectId: string,
  archived = false,
  enabled = true,
) {
  return useApiQuery(
    taskKeys.mine(projectId, archived),
    (token) => tasksApi.listMine(token, projectId, { archived }),
    { enabled },
  );
}

export function useCreateTask(projectId: string) {
  return useApiMutation(
    (
      token,
      { activityId, ...body }: CreateTaskPayload & { activityId: string },
    ) => tasksApi.create(token, activityId, body),
    { invalidates: taskWriteKeys(projectId) },
  );
}

export function useUpdateTask(projectId: string) {
  return useApiMutation(
    (token, { id, ...body }: UpdateTaskPayload & { id: string }) =>
      tasksApi.patch(token, id, body),
    { invalidates: taskWriteKeys(projectId) },
  );
}

export function useUpdateTaskStatus(projectId: string) {
  return useApiMutation(
    (token, { id, status }: { id: string; status: TaskStatusValue }) =>
      tasksApi.setStatus(token, id, status),
    { invalidates: taskWriteKeys(projectId) },
  );
}

export function useDeleteTask(projectId: string) {
  return useApiMutation((token, id: string) => tasksApi.remove(token, id), {
    invalidates: taskWriteKeys(projectId),
  });
}

function subtaskWriteKeys(projectId: string) {
  return [taskKeys.listFor(projectId), taskKeys.mineFor(projectId)];
}

export function useCreateSubtask(projectId: string) {
  return useApiMutation(
    (token, { taskId, title }: { taskId: string; title: string }) =>
      subtasksApi.create(token, taskId, { title }),
    { invalidates: subtaskWriteKeys(projectId) },
  );
}

export function useUpdateSubtask(projectId: string) {
  return useApiMutation(
    (
      token,
      { id, ...body }: { id: string; title?: string; done?: boolean },
    ) => subtasksApi.patch(token, id, body),
    { invalidates: subtaskWriteKeys(projectId) },
  );
}

export function useDeleteSubtask(projectId: string) {
  return useApiMutation((token, id: string) => subtasksApi.remove(token, id), {
    invalidates: subtaskWriteKeys(projectId),
  });
}
