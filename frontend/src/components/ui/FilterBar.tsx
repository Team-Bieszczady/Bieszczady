import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { IoCloseOutline } from 'react-icons/io5';
import { Select, type SelectOption } from './Select';

export interface FilterField<T extends FieldValues> {
  name: Path<T>;
  placeholder: string;
  options: readonly SelectOption[];
}

interface FilterBarProps<T extends FieldValues> {
  fields: ReadonlyArray<FilterField<T>>;
  control: Control<T>;
  onClear: () => void;
  className?: string;
}

/** The "Filtruj:" row shared by the list pages: one Select per field, plus a
 * button that resets the whole form back to its empty filters. */
export function FilterBar<T extends FieldValues>({
  fields,
  control,
  onClear,
  className = '',
}: FilterBarProps<T>) {
  return (
    <div
      className={`flex flex-wrap items-center gap-3 gap-y-2 text-xs ${className}`}
    >
      <span className="font-medium text-dark">Filtruj:</span>
      {fields.map(({ name, placeholder, options }) => (
        <Controller
          key={name}
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              placeholder={placeholder}
              options={options}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      ))}
      <button
        className="flex cursor-pointer items-center gap-1 text-gray-500 transition-colors hover:text-dark"
        type="button"
        onClick={onClear}
      >
        <IoCloseOutline className="h-4 w-4" aria-hidden="true" />
        Wyczyść
      </button>
    </div>
  );
}
