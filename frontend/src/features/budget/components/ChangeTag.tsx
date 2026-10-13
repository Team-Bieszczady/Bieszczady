import type { RowChange } from '../types';

const LABEL: Record<RowChange, string> = {
  ADDED: 'Nowa',
  REMOVED: 'Usunięta',
  CHANGED: 'Zmiana',
};

const TONE: Record<RowChange, string> = {
  ADDED: 'bg-lightGreen text-darkGreen',
  REMOVED: 'bg-darkRed/10 text-darkRed',
  CHANGED: 'bg-amberSoft text-amberDark',
};

export function ChangeTag({
  change,
  className = '',
}: {
  change: RowChange;
  className?: string;
}) {
  return (
    <span
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold no-underline whitespace-nowrap ${TONE[change]} ${className}`}
    >
      {LABEL[change]}
    </span>
  );
}
