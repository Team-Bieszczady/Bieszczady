import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { HiOutlinePencil, HiOutlinePlus } from 'react-icons/hi';
import { FiTrash2 } from 'react-icons/fi';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { Button } from '../../../components/ui/Button';
import { InlineEditField } from '../../../components/ui/InlineEditField';
import { INPUT_CLASSES } from '../../../components/ui/formStyles';
import type { Subtask } from '../../projects/types';

interface SubtaskListProps {
  subtasks: Subtask[];
  onAdd: (title: string) => void;
  onRename: (subtaskId: string, title: string) => void;
  onToggle: (subtaskId: string) => void;
  onDelete: (subtaskId: string) => void;
}

function AddSubtaskForm({
  onAdd,
  onClose,
}: {
  onAdd: (title: string) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit, reset, setFocus } = useForm<{
    title: string;
  }>({ defaultValues: { title: '' } });
  const inputId = useId();

  const submit = handleSubmit(({ title }) => {
    if (!title.trim()) {
      onClose();
      return;
    }

    onAdd(title);
    reset();
    setFocus('title');
  });

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <label htmlFor={inputId} className="sr-only">
        Nazwa podzadania
      </label>
      <input
        {...register('title')}
        id={inputId}
        autoFocus
        type="text"
        placeholder="Co trzeba zrobić?"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        className={INPUT_CLASSES}
      />
      <Button variant="primary" size="small" type="submit">
        Dodaj
      </Button>
      <Button variant="outline" size="small" type="button" onClick={onClose}>
        Anuluj
      </Button>
    </form>
  );
}

export default function SubtaskList({
  subtasks,
  onAdd,
  onRename,
  onToggle,
  onDelete,
}: SubtaskListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const checkboxId = useId();

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div
          key={subtask.id}
          className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
            subtask.done ? 'border-darkGreen' : 'border-gray-200'
          }`}
        >
          <input
            id={`${checkboxId}-${subtask.id}`}
            type="checkbox"
            checked={subtask.done}
            onChange={() => onToggle(subtask.id)}
            className="h-4 w-4 shrink-0 cursor-pointer accent-darkGreen"
          />

          <div className="min-w-0 flex-1 text-sm">
            <InlineEditField
              value={subtask.title}
              isEditing={editingId === subtask.id}
              onStartEdit={() => setEditingId(subtask.id)}
              onCancel={() => setEditingId(null)}
              onSave={(title) => {
                setEditingId(null);
                onRename(subtask.id, title);
              }}
              canEdit
              ariaLabel={`Podzadanie ${subtask.title}`}
              emptyMessage="Nazwa podzadania nie może być pusta"
              displayClassName={
                subtask.done ? 'font-medium text-darkGreen' : 'text-dark'
              }
              inputClassName="text-sm"
            />
          </div>

          <ActionMenu
            className="shrink-0"
            ariaLabel={`Akcje podzadania ${subtask.title}`}
            items={[
              {
                id: 'edit',
                label: 'Edytuj',
                icon: (
                  <HiOutlinePencil className="h-4 w-4" aria-hidden="true" />
                ),
                onSelect: () => setEditingId(subtask.id),
              },
              {
                id: 'delete',
                label: 'Usuń',
                tone: 'danger',
                icon: <FiTrash2 className="h-4 w-4" aria-hidden="true" />,
                onSelect: () => onDelete(subtask.id),
              },
            ]}
          />
        </div>
      ))}

      {subtasks.length === 0 && !isAdding && (
        <p className="text-xs text-mutedText">
          Brak podzadań. Podziel zadanie na kroki, żeby śledzić postęp.
        </p>
      )}

      {isAdding ? (
        <AddSubtaskForm onAdd={onAdd} onClose={() => setIsAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-darkGreen transition-colors hover:text-darkGreenHover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-darkGreen"
        >
          <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
          Dodaj podzadanie
        </button>
      )}
    </div>
  );
}
