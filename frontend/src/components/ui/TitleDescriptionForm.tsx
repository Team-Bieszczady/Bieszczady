import { useId } from 'react';
import { FieldError } from './FieldError';
import { useForm } from 'react-hook-form';
import { Button } from './Button';
import { FIELD_LABEL_CLASSES } from './formStyles';

export interface TitleDescriptionValues {
  title: string;
  description: string;
}

interface TitleDescriptionFormProps {
  title: string;
  description: string;
  titleLabel: string;
  descriptionLabel: string;
  titleEmptyMessage: string;
  descriptionEmptyMessage: string;
  titleInputClassName?: string;
  /** Resolves false when the save was rejected, so the form can stay open. */
  onSave: (values: TitleDescriptionValues) => Promise<boolean>;
  onCancel: () => void;
}

export function TitleDescriptionForm({
  title,
  description,
  titleLabel,
  descriptionLabel,
  titleEmptyMessage,
  descriptionEmptyMessage,
  titleInputClassName = 'text-sm font-bold text-dark',
  onSave,
  onCancel,
}: TitleDescriptionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TitleDescriptionValues>({
    defaultValues: { title, description },
  });
  const titleId = useId();
  const descriptionId = useId();
  const submit = handleSubmit(async (values) => {
    await onSave({
      title: values.title.trim(),
      description: values.description.trim(),
    });
  });

  return (
    <form
      onSubmit={submit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
      className="w-full"
    >
      <div>
        <label className={FIELD_LABEL_CLASSES} htmlFor={titleId}>
          {titleLabel}
        </label>
        <input
          {...register('title', {
            validate: (value) => value.trim().length > 0 || titleEmptyMessage,
          })}
          id={titleId}
          autoFocus
          type="text"
          className={`w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none ${titleInputClassName}`}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div className="mt-3">
        <label className={FIELD_LABEL_CLASSES} htmlFor={descriptionId}>
          {descriptionLabel}
        </label>
        <textarea
          {...register('description', {
            validate: (value) =>
              value.trim().length > 0 || descriptionEmptyMessage,
          })}
          id={descriptionId}
          rows={3}
          className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant="primary"
          size="small"
          type="submit"
          isPending={isSubmitting}
          disabled={isSubmitting}
          className="font-medium!"
        >
          Zapisz
        </Button>
        <Button
          variant="outline"
          size="small"
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
      </div>
    </form>
  );
}
