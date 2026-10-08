import type { BudgetState } from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcGrandTotals,
  calcSpend,
  formatMoney,
} from '../utils/budgetTotals';

interface BudgetSummaryProps {
  state: BudgetState;
}

export function BudgetSummary({ state }: BudgetSummaryProps) {
  const totals = calcGrandTotals(state.categories, state.columns);
  const planned = totals[PLANNED_COLUMN_ID] ?? 0;
  const spent = totals[SPENT_COLUMN_ID] ?? 0;
  const { remaining } = calcSpend(planned, spent);

  const cards = [
    { label: 'Plan całkowity', value: planned },
    { label: 'Wydano', value: spent },
    { label: 'Zostało', value: remaining },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map(({ label, value }) => (
        <div
          key={label}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <p className="text-[11px] tracking-wide text-gray-500 uppercase">
            {label}
          </p>
          <p
            className={`mt-1 text-lg font-bold tabular-nums lg:text-xl ${
              value < 0 ? 'text-darkRed' : 'text-dark'
            }`}
          >
            {formatMoney(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
