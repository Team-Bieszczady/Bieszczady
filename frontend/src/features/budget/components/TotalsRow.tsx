import { Fragment } from 'react';
import type { Category, Column } from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcGrandTotals,
  calcSpend,
  formatMoney,
} from '../utils/budgetTotals';
import { RemainingCell, UsageCell } from './SpendCells';

interface TotalsRowProps {
  categories: Category[];
  columns: Column[];
}

export function TotalsRow({ categories, columns }: TotalsRowProps) {
  const totals = calcGrandTotals(categories, columns);
  const spend = calcSpend(totals[PLANNED_COLUMN_ID], totals[SPENT_COLUMN_ID]);
  const isEmpty = totals[PLANNED_COLUMN_ID] == null;

  return (
    <tr className="border-t-2 border-gray-200 bg-gray-100 text-xs font-bold text-dark">
      <th scope="row" className="px-3 py-3 text-left">
        RAZEM
      </th>
      {columns.map((column) => (
        <Fragment key={column.id}>
          <td className="px-3 py-3 whitespace-nowrap tabular-nums">
            {column.type === 'money' ? formatMoney(totals[column.id]) : ''}
          </td>
          {column.id === SPENT_COLUMN_ID && (
            <RemainingCell spend={spend} isEmpty={isEmpty} />
          )}
        </Fragment>
      ))}
      <UsageCell spend={spend} isEmpty={isEmpty} showBar={false} />
      <td />
    </tr>
  );
}
