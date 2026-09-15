import type { ReactNode } from 'react';

interface EmptySectionStateProps {
  title: ReactNode;
  hint?: ReactNode;
  canEdit?: boolean;
  bare?: boolean;
  className?: string;
}

export default function EmptySectionState({
  title,
  hint,
  canEdit = false,
  bare = false,
  className = '',
}: EmptySectionStateProps) {
  const shell = bare
    ? 'px-4 py-8 text-center'
    : 'rounded-xl border border-gray-200 bg-white px-4 py-10 text-center';

  return (
    <div className={`${shell} ${className}`}>
      <p className="text-sm text-grayText">{title}</p>
      {canEdit && hint && <p className="mt-1 text-xs text-mutedText">{hint}</p>}
    </div>
  );
}
