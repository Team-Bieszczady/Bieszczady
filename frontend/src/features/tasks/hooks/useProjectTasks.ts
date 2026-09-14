import type { AuthenticatedUser } from '../../../lib/api';
import { failure, type ActionFailure } from '../../../lib/actionResult';
import type { SelectOption } from '../../../components/ui/Select';
import { useMembers, useStages } from '../../projects/hooks/useProjectsApi';
import type { TaskFormValues } from '../../projects/types';
import { mapBackendTask, type TaskRow } from '../data';
import { canManageTasks } from '../utils/taskPermissions';
import {
  useCreateSubtask,
  useCreateTask,
  useDeleteSubtask,
  useDeleteTask,
  useMyTasks,
  useTasks,
  useUpdateSubtask,
  useUpdateTask,
  useUpdateTaskStatus,
} from './useTasksApi';

export type TaskResult =
  | { ok: true; autoClosed?: boolean; reopened?: boolean }
  | ActionFailure;

export function useProjectTasks(
  projectId: string,
  user: AuthenticatedUser | null,
) {

  const stagesQuery = useStages(projectId, true);
  const membersQuery = useMembers(projectId);

  const members = membersQuery.data ?? [];
  const stages = stagesQuery.data ?? [];
  const manages = canManageTasks(user, members);
  const roleKnown = !membersQuery.isLoading;
  const allQuery = useTasks(projectId, false, roleKnown && manages);
  const mineQuery = useMyTasks(projectId, false, roleKnown && !manages);
  const tasksQuery = manages ? allQuery : mineQuery;

  const rows: TaskRow[] = (tasksQuery.data ?? []).map(mapBackendTask);

  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId);
  const setStatus = useUpdateTaskStatus(projectId);
  const removeTask = useDeleteTask(projectId);
  const createSubtask = useCreateSubtask(projectId);
  const updateSubtask = useUpdateSubtask(projectId);
  const removeSubtask = useDeleteSubtask(projectId);

  const openStages = stages.filter(
    (stage) => !stage.archivedAt && !stage.completedAt,
  );

  const actionOptions: SelectOption[] = openStages.flatMap((stage) =>
    stage.activities.map((activity) => ({
      value: activity.id,
      label: `${stage.name} · ${activity.name}`,
    })),
  );

  const optionsForRow = (row: TaskRow): SelectOption[] =>
    actionOptions.some((option) => option.value === row.actionId)
      ? actionOptions
      : [
          ...actionOptions,
          {
            value: row.actionId,
            label: `${row.stageName} · ${row.actionTitle}`,
          },
        ];

  const ownerOptions: SelectOption[] = members
    .map((member) => ({
      value: member.userId,
      label: `${member.user.firstName} ${member.user.lastName}`.trim(),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pl'));


  function predictStageChange(
    row: TaskRow,
    nextStatus: string,
  ): { autoClosed?: boolean; reopened?: boolean } {
    const stage = stages.find((entry) => entry.id === row.stageId);
    if (!stage) return {};

    const wasDone = row.status === 'DONE';
    const willBeDone = nextStatus === 'DONE';
    if (wasDone === willBeDone) return {};

    if (willBeDone) {
      const pendingAfter = stage.counts.pending - 1;
      return {
        autoClosed:
          stage.completedAt === null &&
          stage.counts.total > 0 &&
          pendingAfter === 0,
      };
    }
    return { reopened: stage.completedAt !== null };
  }


  const addTask = async (values: TaskFormValues): Promise<TaskResult> => {
    try {
      await createTask.mutateAsync({
        activityId: values.actionId,
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate,
        ownerId: values.ownerId,
      });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się dodać zadania');
    }
  };

  const editTask = async (
    row: TaskRow,
    values: TaskFormValues,
  ): Promise<TaskResult> => {
    try {
      await updateTask.mutateAsync({
        id: row.id,
        title: values.title,
        description: values.description,
        priority: values.priority,
        dueDate: values.dueDate,
        ownerId: values.ownerId,
        activityId: values.actionId,
      });

      if (values.status !== row.status) {
        await setStatus.mutateAsync({ id: row.id, status: values.status });
        return { ok: true, ...predictStageChange(row, values.status) };
      }
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zapisać zadania');
    }
  };

  const toggleTask = async (row: TaskRow): Promise<TaskResult> => {
    const next = row.status === 'DONE' ? 'NEW' : 'DONE';
    try {
      await setStatus.mutateAsync({ id: row.id, status: next });
      return { ok: true, ...predictStageChange(row, next) };
    } catch (error) {
      return failure(error, 'Nie udało się zmienić statusu zadania');
    }
  };

  const deleteTask = async (row: TaskRow): Promise<TaskResult> => {
    try {
      await removeTask.mutateAsync(row.id);
      const stage = stages.find((entry) => entry.id === row.stageId);
      const reopened =
        !!stage && stage.completedAt !== null && stage.counts.total === 1;
      return { ok: true, reopened };
    } catch (error) {
      return failure(error, 'Nie udało się usunąć zadania');
    }
  };

  const addSubtask = async (
    taskId: string,
    title: string,
  ): Promise<TaskResult> => {
    try {
      await createSubtask.mutateAsync({ taskId, title });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się dodać podzadania');
    }
  };

  const renameSubtask = async (
    subtaskId: string,
    title: string,
  ): Promise<TaskResult> => {
    try {
      await updateSubtask.mutateAsync({ id: subtaskId, title });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zapisać podzadania');
    }
  };

  const toggleSubtask = async (
    subtaskId: string,
    done: boolean,
  ): Promise<TaskResult> => {
    try {
      await updateSubtask.mutateAsync({ id: subtaskId, done });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zapisać podzadania');
    }
  };

  const deleteSubtask = async (subtaskId: string): Promise<TaskResult> => {
    try {
      await removeSubtask.mutateAsync(subtaskId);
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się usunąć podzadania');
    }
  };

  return {
    rows,
    members,
    manages,
    isLoading: membersQuery.isLoading || tasksQuery.isLoading,
    isSubmitting:
      createTask.isPending ||
      updateTask.isPending ||
      setStatus.isPending ||
      removeTask.isPending,
    actionOptions,
    optionsForRow,
    ownerOptions,
    addTask,
    editTask,
    toggleTask,
    deleteTask,
    addSubtask,
    renameSubtask,
    toggleSubtask,
    deleteSubtask,
  };
}
