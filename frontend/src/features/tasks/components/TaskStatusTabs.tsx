import type { TaskStatus } from '../../projects/types';
import { TASK_STATUS_TABS } from '../constants';

interface TaskStatusTabsProps {
  value: TaskStatus | null;
  counts: Record<TaskStatus, number>;
  total: number;
  onChange: (status: TaskStatus | null) => void;
}

export default function TaskStatusTabs({
  value,
  counts,
  total,
  onChange,
}: TaskStatusTabsProps) {
  return (
    <div className="relative mb-4">
      <div
        role="tablist"
        aria-label="Filtruj po statusie"
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-gray-200"
      >
        {TASK_STATUS_TABS.map((tab) => {
          const isActive = tab.value === value;
          const count = tab.value === null ? total : counts[tab.value];

          return (
            <button
              key={tab.value ?? 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.value)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3 py-2.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none ${
                isActive
                  ? 'border-darkGreen font-semibold text-darkGreen'
                  : 'border-transparent text-grayText hover:text-dark'
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                  isActive
                    ? 'bg-lightGreen text-darkGreen'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 bottom-px w-8 bg-linear-to-l from-white sm:hidden"
      />
    </div>
  );
}
