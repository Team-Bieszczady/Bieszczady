import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { FieldError } from './FieldError';

interface InlineEditFormProps {
  defaultValue: string;
  ariaLabel: string;
  emptyMessage: string;
  inputClassName: string;
  onSave: (value: string) => void | Promise<unknown>;
  onCancel: () => void;
  saveOnBlur: boolean;
}

function InlineEditForm({
  defaultValue,
  ariaLabel,
  emptyMessage,
  inputClassName,
  onSave,
  onCancel: cancelEdit,
  saveOnBlur,
}: InlineEditFormProps) {
  const isClosingRef = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ value: string }>({ defaultValues: { value: defaultValue } });

  const submit = handleSubmit(async ({ value }) => {
    await onSave(value.trim());
  });
  const field = register('value', {
    validate: (value) => value.trim().length > 0 || emptyMessage,
  });

  const onCancel = () => {
    isClosingRef.current = true;
    cancelEdit();
  };

  return (
    <form onSubmit={submit} className="relative w-full">
      <input
        {...field}
        onBlur={(event) => {
          field.onBlur(event);
          if (saveOnBlur && !isClosingRef.current) submit();
        }}
        autoFocus
        type="text"
        disabled={isSubmitting}
        aria-label={ariaLabel}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onCancel();
          }
        }}
        className={`w-full rounded-lg border border-gray-300 px-2 py-1 focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none ${inputClassName}`}
      />
      <div className="absolute top-full left-0 z-10 whitespace-nowrap">
        <FieldError message={errors.value?.message} />
      </div>
    </form>
  );
}

interface InlineEditFieldProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: (value: string) => void | Promise<unknown>;
  canEdit: boolean;
  ariaLabel: string;
  emptyMessage?: string;
  displayClassName?: string;
  inputClassName?: string;
  saveOnBlur?: boolean;
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
  saveOnBlur = false,
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
        saveOnBlur={saveOnBlur}
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
      aria-label={`${ariaLabel}, kliknij, aby edytować`}
      className={`-mx-1.5 -my-0.5 block w-full cursor-text truncate rounded-lg px-1.5 py-0.5 text-left transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-darkGreen ${displayClassName}`}
    >
      {value}
    </button>
  );
}
