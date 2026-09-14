import { HiOutlinePencil } from 'react-icons/hi';
import { FiTrash2 } from 'react-icons/fi';
import { ActionMenu } from '../../../../components/ui/ActionMenu';
import {
  TitleDescriptionForm,
  type TitleDescriptionValues,
} from '../../../../components/ui/TitleDescriptionForm';
import type { GoalView } from '../../hooks/useProjectGoals';

interface GoalCardProps {
  goal: GoalView;
  index: number;
  canEdit: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: (values: TitleDescriptionValues) => void;
  onDelete: () => void;
}

export default function GoalCard({
  goal,
  index,
  canEdit,
  isEditing,
  onStartEdit,
  onCancel,
  onSave,
  onDelete,
}: GoalCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50 800:px-6">
      {isEditing ? (
        <TitleDescriptionForm
          title={goal.title}
          description={goal.description}
          titleLabel={`CEL ${index + 1}`}
          descriptionLabel="Opis"
          titleEmptyMessage="Nazwa celu nie może być pusta"
          descriptionEmptyMessage="Opis celu nie może być pusty"
          titleInputClassName="text-sm font-bold text-dark 800:text-base"
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.5px] text-mutedText">
                CEL {index + 1}
              </p>
              <h3 className="mt-1.5 text-sm font-bold text-dark 800:text-base">
                {goal.title}
              </h3>
            </div>

            {canEdit && (
              <ActionMenu
                ariaLabel={`Akcje celu ${goal.title}`}
                className="-mr-1 shrink-0"
                items={[
                  {
                    id: 'edit',
                    label: 'Edytuj',
                    icon: (
                      <HiOutlinePencil
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                    ),
                    onSelect: onStartEdit,
                  },
                  {
                    id: 'delete',
                    label: 'Usuń',
                    tone: 'danger',
                    icon: (
                      <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    ),
                    onSelect: onDelete,
                  },
                ]}
              />
            )}
          </div>
          <p className="mt-1 text-xs text-grayText 800:text-sm">
            {goal.description}
          </p>
        </>
      )}
    </article>
  );
}
