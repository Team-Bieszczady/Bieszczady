import type { BudgetVersion } from '../types';

interface BudgetVersionTabsProps {
  versions: BudgetVersion[];
  activeId: string;
  onChange: (id: string) => void;
}

export function BudgetVersionTabs({
  versions,
  activeId,
  onChange,
}: BudgetVersionTabsProps) {
  return (
    <div
      role="group"
      aria-label="Wersja budżetu"
      className="no-scrollbar mb-4 inline-flex max-w-full gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1"
    >
      {versions.map((version) => (
        <button
          key={version.id}
          type="button"
          aria-pressed={activeId === version.id}
          onClick={() => onChange(version.id)}
          className={`inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md px-4 text-xs whitespace-nowrap transition-colors max-lg:h-7 max-lg:px-3 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none ${
            activeId === version.id
              ? 'bg-white font-semibold text-darkGreen shadow-sm'
              : 'font-medium text-gray-700 hover:text-dark'
          }`}
        >
          {version.label}
        </button>
      ))}
    </div>
  );
}
