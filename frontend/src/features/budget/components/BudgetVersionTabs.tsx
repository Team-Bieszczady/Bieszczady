import { VERSION_STATUS_CLASSES, VERSION_STATUS_LABELS } from '../data';
import type { BudgetVersion } from '../types';

interface BudgetVersionTabsProps {
  versions: BudgetVersion[];
  activeId: string;
  onChange: (id: string) => void;
  showChanges: boolean;
  canShowChanges: boolean;
  onToggleChanges: () => void;
}

export function BudgetVersionTabs({
  versions,
  activeId,
  onChange,
  showChanges,
  canShowChanges,
  onToggleChanges,
}: BudgetVersionTabsProps) {
  const ordered = [...versions].sort((a, b) => a.number - b.number);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Wersja budżetu"
        className="no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1"
      >
        {ordered.map((version) => (
          <button
            key={version.id}
            type="button"
            aria-pressed={activeId === version.id}
            onClick={() => onChange(version.id)}
            className={`inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-xs whitespace-nowrap transition-colors max-lg:h-7 max-lg:px-3 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none ${
              activeId === version.id
                ? 'bg-white font-semibold text-darkGreen shadow-sm'
                : 'font-medium text-gray-700 hover:text-dark'
            }`}
          >
            {version.name}
            {version.status !== 'APPROVED' && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERSION_STATUS_CLASSES[version.status]}`}
              >
                {VERSION_STATUS_LABELS[version.status]}
              </span>
            )}
            {version.isCurrent && (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${VERSION_STATUS_CLASSES.APPROVED}`}
              >
                Aktualny
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={showChanges && canShowChanges}
        disabled={!canShowChanges}
        onClick={onToggleChanges}
        className="inline-flex cursor-pointer items-center gap-2 rounded-md text-xs font-medium text-dark focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={`relative inline-flex h-4 w-7 shrink-0 rounded-full transition-colors ${
            showChanges && canShowChanges ? 'bg-darkGreen' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
              showChanges && canShowChanges
                ? 'translate-x-3.5'
                : 'translate-x-0.5'
            }`}
          />
        </span>
        Pokaż zmiany
      </button>
    </div>
  );
}
