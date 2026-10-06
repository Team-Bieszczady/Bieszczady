import { failure, type ActionFailure } from '../../../lib/actionResult';
import type {
  BackendIndicator,
  IndicatorPayload,
  IndicatorScopeValue,
} from '../../../lib/projectsApi';
import {
  useCreateIndicator,
  useDeleteIndicator,
  useIndicators,
  useUpdateIndicator,
  useUpdateIndicatorProgress,
} from './useProjectsApi';

export interface IndicatorView extends BackendIndicator {
  ownerId: string | null;
  ownerName: string | null;
  assignment: string;
}

export interface IndicatorFormValues {
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  scope: IndicatorScopeValue;
  assignment: string;
  folderIds: string[];
  ownerId: string | null;
}

export type IndicatorResult = { ok: true } | ActionFailure;

function toPayload(values: IndicatorFormValues): IndicatorPayload {
  const [kind, id] = values.assignment.split(':');
  const isStage = values.scope === 'STAGE';

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    targetValue: values.targetValue,
    currentValue: values.currentValue,
    scope: values.scope,
    stageId: isStage && kind === 'stage' ? id : null,
    taskId: isStage && kind === 'task' ? id : null,
    folderIds: values.folderIds,
    ownerId: values.ownerId,
  };
}

export function useProjectIndicators(projectId: string) {
  const query = useIndicators(projectId);
  const createIndicator = useCreateIndicator(projectId);
  const updateIndicator = useUpdateIndicator(projectId);
  const progress = useUpdateIndicatorProgress(projectId);
  const removeIndicator = useDeleteIndicator(projectId);

  const indicators: IndicatorView[] = (query.data ?? []).map((indicator) => ({
    ...indicator,
    ownerId: indicator.owner?.id ?? null,
    ownerName: indicator.owner
      ? `${indicator.owner.firstName} ${indicator.owner.lastName}`
      : null,
    assignment: indicator.task
      ? `task:${indicator.task.id}`
      : indicator.stage && indicator.scope === 'STAGE'
        ? `stage:${indicator.stage.id}`
        : '',
  }));

  const addIndicator = async (
    values: IndicatorFormValues,
  ): Promise<IndicatorResult> => {
    try {
      await createIndicator.mutateAsync(toPayload(values));
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się dodać wskaźnika');
    }
  };

  const editIndicator = async (
    id: string,
    values: IndicatorFormValues,
  ): Promise<IndicatorResult> => {
    try {
      await updateIndicator.mutateAsync({ id, ...toPayload(values) });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zapisać wskaźnika');
    }
  };

  const stepIndicator = async (
    id: string,
    delta: 1 | -1,
  ): Promise<IndicatorResult> => {
    try {
      await progress.mutateAsync({ id, delta });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zmienić postępu wskaźnika');
    }
  };

  const deleteIndicator = async (id: string): Promise<IndicatorResult> => {
    try {
      await removeIndicator.mutateAsync(id);
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się usunąć wskaźnika');
    }
  };

  return {
    indicators,
    steppingId: progress.isPending ? progress.variables?.id : undefined,
    addIndicator,
    editIndicator,
    stepIndicator,
    deleteIndicator,
  };
}
