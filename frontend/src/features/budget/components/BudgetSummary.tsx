import ProgressBar from '../../projects/components/ProgressBar';
import {
  CATEGORY_FORMS,
  pluralizePl,
  polishForm,
} from '../../../lib/pluralizePl';
import type { Column, PlanCategory, PositionActuals } from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcCategoryTotals,
  calcGrandTotals,
  calcSpend,
  formatMoney,
} from '../utils/budgetTotals';

interface BudgetSummaryProps {
  categories: PlanCategory[];
  columns: Column[];
  actuals: Record<string, PositionActuals>;
}

const EXCEEDS_FORMS = ['przekracza', 'przekraczają', 'przekracza'] as const;

export function BudgetSummary({
  categories,
  columns,
  actuals,
}: BudgetSummaryProps) {
  const totals = calcGrandTotals(categories, columns, actuals);
  const planned = totals[PLANNED_COLUMN_ID] ?? 0;
  const spent = totals[SPENT_COLUMN_ID] ?? 0;
  const { remaining, usage, isOver } = calcSpend(planned, spent);
  const percent = usage === null ? 0 : Math.round(usage * 100);
  const overCount = categories.filter((category) => {
    const categoryTotals = calcCategoryTotals(category, columns, actuals);
    return calcSpend(
      categoryTotals[PLANNED_COLUMN_ID],
      categoryTotals[SPENT_COLUMN_ID],
    ).isOver;
  }).length;

  const items = [
    { label: 'Plan', value: planned, caption: null },
    { label: 'Poniesione', value: spent, caption: null },
    {
      label: 'Pozostało',
      value: remaining,
      caption:
        overCount > 0
          ? `${pluralizePl(overCount, CATEGORY_FORMS)} ${EXCEEDS_FORMS[polishForm(overCount)]} plan`
          : 'Wszystko w planie',
    },
  ];

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xs text-grayText">{item.label}</p>
            <p
              className={`mt-1 text-lg font-bold tabular-nums lg:text-xl ${
                item.value < 0 ? 'text-darkRed' : 'text-dark'
              }`}
            >
              {formatMoney(item.value)}
            </p>
            {item.caption && (
              <p
                className={`mt-1 text-xs ${
                  overCount > 0 ? 'font-semibold text-darkRed' : 'text-grayText'
                }`}
              >
                {item.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ProgressBar
          percent={Math.min(percent, 100)}
          ariaLabel="Wykorzystanie budżetu"
          className="flex-1"
        />
        <span
          className={`text-xs font-bold tabular-nums ${
            isOver ? 'text-darkRed' : 'text-darkGreen'
          }`}
        >
          {percent}%
        </span>
      </div>
    </div>
  );
}
