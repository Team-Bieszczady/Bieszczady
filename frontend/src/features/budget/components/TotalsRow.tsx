import type { Category, Column } from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcGrandTotals,
  calcSpend,
  formatMoney,
} from '../utils/budgetTotals';
import { SpendCells } from './SpendCells';

interface TotalsRowProps {
  categories: Category[];
  columns: Column[];
}

export function TotalsRow({ categories, columns }: TotalsRowProps) {
  const totals = calcGrandTotals(categories, columns);

  return (
    <tr className="border-t-2 border-gray-200 bg-gray-100 text-xs font-bold text-dark">
      <th scope="row" className="px-4 py-3 text-left">
        RAZEM
      </th>
      {columns.map((column) => (
        <td
          key={column.id}
          className="px-4 py-3 text-right whitespace-nowrap tabular-nums"
        >
          {column.type === 'money' ? formatMoney(totals[column.id]) : ''}
        </td>
      ))}
      <SpendCells
        spend={calcSpend(totals[PLANNED_COLUMN_ID], totals[SPENT_COLUMN_ID])}
        isEmpty={totals[PLANNED_COLUMN_ID] == null}
      />
      <td />
    </tr>
  );
}
