import { IoCheckmark } from 'react-icons/io5';

export interface Swatch {
  id: string;
  label: string;
  dot: string;
}

interface SwatchPickerProps {
  colors: ReadonlyArray<Swatch>;
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}

export function SwatchPicker({
  colors,
  value,
  onChange,
  ariaLabel,
  className = '',
}: SwatchPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {colors.map((color) => {
        const isSelected = color.id === value;

        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={color.label}
            title={color.label}
            onClick={() => onChange(color.id)}
            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark/30 ${
              color.dot
            } ${isSelected ? 'ring-2 ring-dark/60 ring-offset-2' : ''}`}
          >
            {isSelected && (
              <IoCheckmark className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
