import { IoCloseOutline } from 'react-icons/io5';

export type ChipTone = 'neutral' | 'outline';

export const CHIP_BASE =
  'inline-flex h-7 items-center rounded-full px-3 text-[11px] font-medium 800:rounded-lg';

const TONE: Record<ChipTone, string> = {
  neutral: 'bg-gray-100 text-dark',
  outline: 'border border-gray-200 bg-transparent text-grayText',
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
          className="-mr-1 cursor-pointer rounded-full px-1 text-xs leading-none text-grayText transition-colors hover:text-dark focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-darkGreen"
        >
          <IoCloseOutline className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
