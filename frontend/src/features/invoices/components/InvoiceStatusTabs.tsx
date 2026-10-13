import type { InvoiceTab, InvoiceTabCounts } from '../invoiceSummary';

interface InvoiceStatusTabsProps {
  value: InvoiceTab;
  counts: InvoiceTabCounts;
  total: number;
  onChange: (value: InvoiceTab) => void;
}

const STATUS_TABS: { value: InvoiceTab; label: string }[] = [
  { value: null, label: 'Wszystkie' },
  { value: 'TO_PAY', label: 'Do zapłaty' },
  { value: 'OVERDUE', label: 'Po terminie' },
  { value: 'PAID', label: 'Zapłacone' },
];

function countFor(tab: InvoiceTab, counts: InvoiceTabCounts, total: number) {
  if (tab === null) return total;
  if (tab === 'TO_PAY') return counts.toPay;
  if (tab === 'OVERDUE') return counts.overdue;
  return counts.paid;
}

export function InvoiceStatusTabs({
  value,
  counts,
  total,
  onChange,
}: InvoiceStatusTabsProps) {
  return (
    <div className="relative">
      <div
        role="tablist"
        aria-label="Filtruj po statusie"
        className="no-scrollbar flex gap-1 overflow-x-auto border-b border-gray-200"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === value;
          const count = countFor(tab.value, counts, total);

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
