import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

interface RadioOptionCardProps {
  value: string;
  title: string;
  hint: ReactNode;
  isSelected: boolean;
  registration: UseFormRegisterReturn;
  disabled?: boolean;
  tone?: 'default' | 'danger';
  children?: ReactNode;
}

export function RadioOptionCard({
  value,
  title,
  hint,
  isSelected,
  registration,
  disabled = false,
  tone = 'default',
  children,
}: RadioOptionCardProps) {
  return (
    <label
      className={`block rounded-lg border px-3 py-2.5 transition-colors focus-within:ring-1 focus-within:ring-darkGreen ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
          : isSelected
            ? 'cursor-pointer border-darkGreen bg-lightGreen/40'
            : 'cursor-pointer border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <span className="flex gap-3">
        <input
          {...registration}
          type="radio"
          value={value}
          disabled={disabled}
          className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
            tone === 'danger' ? 'accent-darkRed' : 'accent-darkGreen'
          }`}
        />
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-dark">{title}</span>
          <span
            className={`mt-0.5 block text-[11px] leading-relaxed ${
              tone === 'danger' ? 'text-darkRed' : 'text-grayText'
            }`}
          >
            {hint}
          </span>
        </span>
      </span>

      {isSelected && children && <div className="mt-3 pl-6.5">{children}</div>}
    </label>
  );
}
