import type { UseFormRegisterReturn } from 'react-hook-form';
import { FIELD_LABEL_CLASSES } from './formStyles';

export interface RadioPillOption {
  value: string;
  label: string;
}

interface RadioPillGroupProps {
  legend: string;
  options: RadioPillOption[];
  value: string;
  registration: UseFormRegisterReturn;
}

export function RadioPillGroup({
  legend,
  options,
  value,
  registration,
}: RadioPillGroupProps) {
  return (
    <fieldset>
      <legend className={FIELD_LABEL_CLASSES}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full border px-4 py-1.5 text-xs font-medium transition-colors focus-within:ring-1 focus-within:ring-darkGreen focus-within:ring-offset-1 ${
                isSelected
                  ? 'border-darkGreen bg-darkGreen text-white'
                  : 'border-gray-300 bg-white text-dark hover:bg-gray-50'
              }`}
            >
              <input
                {...registration}
                type="radio"
                value={option.value}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
