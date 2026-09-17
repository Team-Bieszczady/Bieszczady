import type { BackendStage } from '../../../lib/projectsApi';
import { normalizeText } from '../../../lib/normalizeText';
import type {
  ProjectSchedule,
  ScheduleAction,
  ScheduleTask,
} from '../types';
import type { Stage } from '../types';
import { useUpdateTaskStatus } from '../../tasks/hooks/useTasksApi';
import { todayIso } from '../utils/isoDate';
import {
  SCHEDULE_ISSUE_MESSAGES,
  getActionStageTargets,
  validateActionTitle,
  validateStageAcceptsWork,
  type ScheduleIssue,
} from '../utils/scheduleRules';
import {
  buildScheduleIndex,
  countsForStage,
  overdueTasks,
  tasksForStage,
  type ScheduleIndex,
  type TaskCounts,
} from '../utils/scheduleState';
import {
  getMoveTargets,
  validateMoveTarget,
  validateStageDates,
  type StageIssue,
  type StageShiftSuggestion,
} from '../utils/stageRules';
import {
  useArchiveStage,
  useCreateActivity,
  useCreateStage,
  useDeleteActivity,
  useDeleteStage,
  useMoveActivity,
  useMoveStageDeadline,
  useShiftFollowingStages,
  useStages,
  useProject,
  useUpdateActivity,
  useUpdateStage,
} from './useProjectsApi';
import type {
  ActionFormValues,
  DeleteStrategy,
  StageEditValues,
  StageFormValues,
} from '../types';

export type PlanResult<Issue> =
  | { ok: true }
  | { ok: false; issue: Issue }
  | { ok: false; message: string };

export type StageResult = PlanResult<StageIssue>;
export type ActionResult = PlanResult<ScheduleIssue>;

export interface MoveDeadlineApiResult {
  ok: boolean;
  issue?: StageIssue;
  message?: string;
  suggestions: StageShiftSuggestion[];
}

const day = (value: string | null): string | null =>
  value ? value.slice(0, 10) : null;

function toStage(stage: BackendStage): Stage {
  return {
    id: stage.id,
    name: stage.name,
    description: stage.description,
    startDate: day(stage.startDate),
    deadline: day(stage.deadline) ?? stage.deadline,
    originalDeadline: day(stage.originalDeadline),
    deadlineNote: stage.deadlineNote,
    completedAt: stage.completedAt,
    archivedAt: stage.archivedAt,
  };
}


function toSchedule(stages: BackendStage[]): ProjectSchedule {
  const actions: ScheduleAction[] = [];
  const tasks: ScheduleTask[] = [];

  for (const stage of stages) {
    for (const activity of stage.activities) {
      actions.push({
        id: activity.id,
        stageId: stage.id,
        title: activity.name,
      });

      for (const task of activity.tasks) {
        tasks.push({
          id: task.id,
          actionId: activity.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: day(task.dueDate),
          owner: task.owner
            ? `${task.owner.firstName} ${task.owner.lastName}`
            : null,
          ownerId: task.owner?.id ?? null,
        });
      }
    }
  }

  return { actions, tasks };
}

function asFailure<Issue>(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return { ok: false as const, message } satisfies PlanResult<Issue>;
}

export function useProjectPlanApi(projectId: string) {
  const query = useStages(projectId, true);
  const { data: project } = useProject(projectId);
  const projectBounds = project
    ? {
        startDate: project.startDate,
        plannedEndDate: project.plannedEndDate,
      }
    : undefined;

  const createStage = useCreateStage(projectId);
  const updateStage = useUpdateStage(projectId);
  const moveStageDeadline = useMoveStageDeadline(projectId);
  const shiftFollowing = useShiftFollowingStages(projectId);
  const archiveStageMutation = useArchiveStage(projectId);
  const deleteStageMutation = useDeleteStage(projectId);
  const createActivity = useCreateActivity(projectId);
  const setTaskStatus = useUpdateTaskStatus(projectId);
  const updateActivity = useUpdateActivity(projectId);
  const moveActivity = useMoveActivity(projectId);
  const deleteActivity = useDeleteActivity(projectId);

  const backendStages = query.data ?? [];
  const stages = backendStages.map(toStage);
  const schedule = toSchedule(backendStages);
  const today = todayIso();

  const index: ScheduleIndex = buildScheduleIndex(schedule);

  const active = stages.filter((stage) => stage.archivedAt === null);
  const archived = stages.filter((stage) => stage.archivedAt !== null);

  const find = (id: string) => stages.find((stage) => stage.id === id);
  const findAction = (id: string) => index.actionById.get(id);

  const countsFor = (stageId: string): TaskCounts =>
    countsForStage(index, stageId);

  const isNameTaken = (name: string, exceptId?: string) =>
    stages.some(
      (stage) =>
        stage.id !== exceptId &&
        normalizeText(stage.name) === normalizeText(name),
    );

  const addStage = async (values: StageFormValues): Promise<StageResult> => {
    const name = values.name.trim();
    if (!name) return { ok: false, issue: 'emptyName' };
    if (isNameTaken(name)) return { ok: false, issue: 'duplicateName' };

    const dates = validateStageDates(
      null,
      { startDate: values.startDate, deadline: values.deadline },
      projectBounds,
    );
    if (!dates.ok) return dates;

    try {
      await createStage.mutateAsync({
        name,
        description: values.description.trim(),
        ...(values.startDate ? { startDate: values.startDate } : {}),
        deadline: values.deadline,
      });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się dodać etapu');
    }
  };

  const editStage = async (
    id: string,
    values: StageEditValues,
  ): Promise<StageResult> => {
    if (!find(id)) return { ok: false, issue: 'notFound' };

    const name = values.name.trim();
    if (!name) return { ok: false, issue: 'emptyName' };
    if (isNameTaken(name, id)) return { ok: false, issue: 'duplicateName' };

    try {
      await updateStage.mutateAsync({
        id,
        name,
        description: values.description.trim(),
      });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się zapisać etapu');
    }
  };

  const moveDeadline = async (
    id: string,
    next: string,
    note: string,
  ): Promise<MoveDeadlineApiResult> => {
    const stage = find(id);
    if (!stage) return { ok: false, issue: 'notFound', suggestions: [] };

    const check = validateStageDates(
      stage,
      { startDate: stage.startDate, deadline: next },
      projectBounds,
    );
    if (!check.ok) return { ok: false, issue: check.issue, suggestions: [] };
    if (next === stage.deadline) return { ok: true, suggestions: [] };

    try {
      const result = await moveStageDeadline.mutateAsync({
        id,
        deadline: next,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      return {
        ok: true,
        suggestions: result.suggestions.map((suggestion) => ({
          ...suggestion,
          currentDeadline:
            day(suggestion.currentDeadline) ?? suggestion.currentDeadline,
          suggestedDeadline:
            day(suggestion.suggestedDeadline) ?? suggestion.suggestedDeadline,
        })),
      };
    } catch (error) {
      const failure = asFailure<StageIssue>(
        error,
        'Nie udało się przenieść terminu',
      );
      return { ok: false, message: failure.message, suggestions: [] };
    }
  };

  const applyFollowingStageShifts = async (
    suggestions: StageShiftSuggestion[],
    sourceStageName: string,
  ): Promise<StageResult> => {
    if (suggestions.length === 0) return { ok: true };

    try {
      await shiftFollowing.mutateAsync({
        shifts: suggestions.map((suggestion) => ({
          stageId: suggestion.stageId,
          deadline: suggestion.suggestedDeadline,
        })),
        note: `Przesunięto wraz z etapem „${sourceStageName}”`,
      });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się przesunąć terminów');
    }
  };

  const setArchived = async (
    id: string,
    archivedNext: boolean,
    fallback: string,
  ): Promise<StageResult> => {
    if (!find(id)) return { ok: false, issue: 'notFound' };

    try {
      await archiveStageMutation.mutateAsync({ id, archived: archivedNext });
      return { ok: true };
    } catch (error) {
      return asFailure(error, fallback);
    }
  };

  const archiveStage = (id: string) =>
    setArchived(id, true, 'Nie udało się zarchiwizować etapu');

  const restoreStage = (id: string) =>
    setArchived(id, false, 'Nie udało się przywrócić etapu');

  const deleteStage = async (
    id: string,
    strategy: DeleteStrategy,
  ): Promise<StageResult> => {
    const stage = find(id);
    if (!stage) return { ok: false, issue: 'notFound' };

    if (stage.completedAt && stage.archivedAt === null) {
      return { ok: false, issue: 'completedNeedsArchive' };
    }

    const ownActions = index.actionsByStage.get(id) ?? [];
    if (ownActions.length > 0 && strategy.kind === 'none') {
      return { ok: false, issue: 'hasContent' };
    }

    if (strategy.kind === 'move') {
      const check = validateMoveTarget(stage, find(strategy.targetStageId));
      if (!check.ok) return check;
    }

    try {
      await deleteStageMutation.mutateAsync({
        id,
        strategy: strategy.kind,
        ...(strategy.kind === 'move'
          ? { targetStageId: strategy.targetStageId }
          : {}),
      });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się usunąć etapu');
    }
  };

  const toggleTask = async (taskId: string): Promise<ActionResult> => {
    const task = schedule.tasks.find((entry) => entry.id === taskId);
    if (!task) return { ok: false, issue: 'taskNotFound' };

    try {
      await setTaskStatus.mutateAsync({
        id: taskId,
        status: task.status === 'DONE' ? 'NEW' : 'DONE',
      });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się zmienić statusu zadania');
    }
  };

  const addAction = async (
    values: ActionFormValues,
  ): Promise<ActionResult> => {
    const accepts = validateStageAcceptsWork(find(values.stageId));
    if (!accepts.ok) return accepts;

    const title = validateActionTitle(
      values.title,
      values.stageId,
      schedule.actions,
    );
    if (!title.ok) return title;

    try {
      await createActivity.mutateAsync({
        stageId: values.stageId,
        name: values.title.trim(),
      });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się dodać działania');
    }
  };

  const editAction = async (
    id: string,
    title: string,
  ): Promise<ActionResult> => {
    const action = findAction(id);
    if (!action) return { ok: false, issue: 'actionNotFound' };

    const accepts = validateStageAcceptsWork(find(action.stageId));
    if (!accepts.ok) return accepts;

    const check = validateActionTitle(
      title,
      action.stageId,
      schedule.actions,
      id,
    );
    if (!check.ok) return check;

    try {
      await updateActivity.mutateAsync({ id, name: title.trim() });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się zapisać działania');
    }
  };

  const moveAction = async (
    id: string,
    stageId: string,
  ): Promise<ActionResult> => {
    const action = findAction(id);
    if (!action) return { ok: false, issue: 'actionNotFound' };
    if (action.stageId === stageId) return { ok: true };

    const accepts = validateStageAcceptsWork(find(stageId));
    if (!accepts.ok) return accepts;

    const check = validateActionTitle(
      action.title,
      stageId,
      schedule.actions,
      id,
    );
    if (!check.ok) return check;

    try {
      await moveActivity.mutateAsync({ id, stageId });
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się przenieść działania');
    }
  };

  const deleteAction = async (id: string): Promise<ActionResult> => {
    const action = findAction(id);
    if (!action) return { ok: false, issue: 'actionNotFound' };

    const accepts = validateStageAcceptsWork(find(action.stageId));
    if (!accepts.ok) return accepts;

    try {
      await deleteActivity.mutateAsync(id);
      return { ok: true };
    } catch (error) {
      return asFailure(error, 'Nie udało się usunąć działania');
    }
  };

  return {
    stages,
    activeStages: active,
    archivedStages: archived,
    schedule,
    index,
    today,

    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),

    addStage,
    editStage,
    moveDeadline,
    applyFollowingStageShifts,
    archiveStage,
    restoreStage,
    deleteStage,

    addAction,
    editAction,
    moveAction,
    deleteAction,
    toggleTask,

    countsFor,
    moveTargetsFor: (id: string) => getMoveTargets(stages, id),
    actionStageTargets: () => getActionStageTargets(active),
    tasksForStage: (id: string) => tasksForStage(index, id),
    overdue: () => overdueTasks(schedule, today),
    scheduleIssueMessage: (issue: keyof typeof SCHEDULE_ISSUE_MESSAGES) =>
      SCHEDULE_ISSUE_MESSAGES[issue],
  };
}

export type ProjectPlanApi = ReturnType<typeof useProjectPlanApi>;
