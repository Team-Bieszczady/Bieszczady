import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import type { TitleDescriptionValues } from '../../../../components/ui/TitleDescriptionForm';
import { Spinner } from '../../../../components/ui/Spinner';
import {
  useProjectGoals,
  type GoalView,
} from '../../hooks/useProjectGoals';
import EmptySectionState from './EmptySectionState';
import OverviewSection from './OverviewSection';
import GoalCard from './GoalCard';

interface GoalsSectionProps {
  projectId: string;
  canEdit: boolean;
}

export default function GoalsSection({
  projectId,
  canEdit,
}: GoalsSectionProps) {
  const {
    goals,
    editingId,
    isLoading,
    addGoal,
    startEdit,
    cancelEdit,
    saveGoal,
    deleteGoal,
  } = useProjectGoals(projectId);
  const [deletingGoal, setDeletingGoal] = useState<GoalView | null>(null);

  const save = async (id: string, values: TitleDescriptionValues) => {
    const result = await saveGoal(id, values);

    if (!result.ok) return toast.error(result.message);
    toast.success(result.wasNew ? 'Cel dodany' : 'Cel zaktualizowany');
  };

  const confirmDelete = async () => {
    if (!deletingGoal) return;

    const result = await deleteGoal(deletingGoal.id);
    setDeletingGoal(null);

    if (!result.ok) return toast.error(result.message);
    toast.success('Cel został usunięty');
  };

  return (
    <OverviewSection
      number={2}
      title="Cele"
      actions={
        canEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={addGoal}
            className="text-xs max-lg:h-7 max-lg:px-4 max-lg:py-1"
          >
            + Dodaj cel
          </Button>
        )
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : goals.length === 0 ? (
        <EmptySectionState
          title="Dodaj cele projektu"
          hint="Cele opisują, co projekt ma osiągnąć."
          canEdit={canEdit}
        />
      ) : (
        <div className="animate-fade-in flex flex-col gap-3">
          {goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              index={index}
              canEdit={canEdit}
              isEditing={editingId === goal.id}
              onStartEdit={() => startEdit(goal.id)}
              onCancel={cancelEdit}
              onSave={(values) => save(goal.id, values)}
              onDelete={() => setDeletingGoal(goal)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={confirmDelete}
        title="Usuń cel"
        description={
          <>
            Czy na pewno chcesz usunąć cel „{deletingGoal?.title}”? Tej operacji
            nie można cofnąć.
          </>
        }
        confirmLabel="Usuń"
        tone="danger"
      />
    </OverviewSection>
  );
}
