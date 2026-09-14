import { useForm } from 'react-hook-form';
import { FieldError } from './FieldError';

interface InlineEditFormProps {
  defaultValue: string;
  ariaLabel: string;
  emptyMessage: string;
  inputClassName: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

function InlineEditForm({
  defaultValue,
  ariaLabel,
  emptyMessage,
  inputClassName,
  onSave,
  onCancel,
}: InlineEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ value: string }>({ defaultValues: { value: defaultValue } });

  const submit = handleSubmit(({ value }) => onSave(value.trim()));

  return (
    <form onSubmit={submit} className="w-full">
      <input
        {...register('value', {
          validate: (value) => value.trim().length > 0 || emptyMessage,
        })}
        autoFocus
        type="text"
        aria-label={ariaLabel}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel();
        }}
        className={`w-full rounded-lg border border-gray-300 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none ${inputClassName}`}
      />
      <FieldError message={errors.value?.message} />
    </form>
  );
}

interface InlineEditFieldProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: (value: string) => void;
  canEdit: boolean;
  ariaLabel: string;
  emptyMessage?: string;
  displayClassName?: string;
  inputClassName?: string;
}

export function InlineEditField({
  value,
  isEditing,
  onStartEdit,
  onCancel,
  onSave,
  canEdit,
  ariaLabel,
  emptyMessage = 'Pole nie może być puste',
  displayClassName = '',
  inputClassName = '',
}: InlineEditFieldProps) {
  if (isEditing && canEdit) {
    return (
      <InlineEditForm
        defaultValue={value}
        ariaLabel={ariaLabel}
        emptyMessage={emptyMessage}
        inputClassName={inputClassName}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }

  if (!canEdit) {
    return <span className={displayClassName}>{value}</span>;
  }

  return (
    <button
      type="button"
      onClick={onStartEdit}
      aria-label={`${ariaLabel} — kliknij, aby edytować`}
      className={`-mx-1.5 -my-0.5 block w-full cursor-text truncate rounded-lg px-1.5 py-0.5 text-left transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-darkGreen ${displayClassName}`}
    >
      {value}
    </button>
  );
}
