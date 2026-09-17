export type ChipTone = 'neutral' | 'accent';

export const CHIP_BASE =
  'inline-flex h-7 items-center rounded-full px-3 text-[11px] font-medium 800:rounded-lg';

const TONE: Record<ChipTone, string> = {
  neutral: 'bg-gray-100 text-dark',
  accent: 'bg-lightGreen text-darkGreen',
};

const REMOVE_TONE: Record<ChipTone, string> = {
  neutral: 'text-grayText hover:text-dark',
  accent: 'text-darkGreen/60 hover:text-darkGreen',
};

interface ChipProps {
  label: string;
  tone?: ChipTone;
  onRemove?: () => void;
  removeLabel?: string;
  className?: string;
}

export function Chip({
  label,
  tone = 'neutral',
  onRemove,
  removeLabel,
  className = '',
}: ChipProps) {
  return (
    <span
      className={`${CHIP_BASE} max-w-full gap-1.5 ${TONE[tone]} ${className}`}
    >
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Usuń ${label}`}
          className={`-mr-1 cursor-pointer rounded-full px-1 text-xs leading-none transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-darkGreen ${REMOVE_TONE[tone]}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
