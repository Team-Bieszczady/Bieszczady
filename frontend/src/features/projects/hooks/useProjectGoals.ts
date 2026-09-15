import { useState } from 'react';
import { failure, type ActionFailure } from '../../../lib/actionResult';
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from './useProjectsApi';

export interface GoalView {
  id: string;
  title: string;
  description: string;
}

export type SaveGoalResult = { ok: true; wasNew: boolean } | ActionFailure;

const DRAFT_ID = '__draft__';

export function useProjectGoals(projectId: string) {
  const query = useGoals(projectId);
  const createGoal = useCreateGoal(projectId);
  const updateGoal = useUpdateGoal(projectId);
  const removeGoal = useDeleteGoal(projectId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);

  const saved: GoalView[] = (query.data ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    description: goal.description,
  }));

  const goals = isDraft
    ? [...saved, { id: DRAFT_ID, title: '', description: '' }]
    : saved;

  const addGoal = () => {
    setIsDraft(true);
    setEditingId(DRAFT_ID);
  };

  const cancelEdit = () => {
    setIsDraft(false);
    setEditingId(null);
  };

  const saveGoal = async (
    id: string,
    values: { title: string; description: string },
  ): Promise<SaveGoalResult> => {
    const wasNew = id === DRAFT_ID;

    try {
      if (wasNew) {
        await createGoal.mutateAsync({
          title: values.title,
          description: values.description,
        });
      } else {
        await updateGoal.mutateAsync({
          id,
          title: values.title,
          description: values.description,
        });
      }
    } catch (error) {
      return failure(error, 'Nie udało się zapisać celu');
    }

    setIsDraft(false);
    setEditingId(null);
    return { ok: true, wasNew };
  };

  const deleteGoal = async (id: string): Promise<SaveGoalResult> => {
    try {
      await removeGoal.mutateAsync(id);
    } catch (error) {
      return failure(error, 'Nie udało się usunąć celu');
    }

    if (editingId === id) cancelEdit();
    return { ok: true, wasNew: false };
  };

  return {
    goals,
    editingId,
    isLoading: query.isLoading,
    addGoal,
    startEdit: (id: string) => setEditingId(id),
    cancelEdit,
    saveGoal,
    deleteGoal,
  };
}
