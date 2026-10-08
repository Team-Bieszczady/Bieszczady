import type { Category, Column } from '../types';

export type Totals = Record<string, number | null>;

const FORMATTER = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 2,
  useGrouping: 'always',
});

export function calcCategoryTotals(
  category: Category,
  columns: Column[],
): Totals {
  const totals: Totals = {};

  for (const column of columns) {
    if (column.type !== 'money') continue;

    totals[column.id] =
      category.positions.length === 0
        ? null
        : category.positions.reduce(
            (sum, position) => sum + (Number(position.values[column.id]) || 0),
            0,
          );
  }

  return totals;
}

export function calcGrandTotals(
  categories: Category[],
  columns: Column[],
): Totals {
  const totals: Totals = {};
  const categoryTotals = categories.map((category) =>
    calcCategoryTotals(category, columns),
  );

  for (const column of columns) {
    if (column.type !== 'money') continue;

    const values = categoryTotals
      .map((categoryTotal) => categoryTotal[column.id])
      .filter((value): value is number => value !== null);

    totals[column.id] =
      values.length === 0
        ? null
        : values.reduce((sum, value) => sum + value, 0);
  }

  return totals;
}

export const PLANNED_COLUMN_ID = 'planned';
export const SPENT_COLUMN_ID = 'incurred';

export interface Spend {
  remaining: number;
  usage: number | null;
  isOver: boolean;
}

export function calcSpend(
  planned: number | null | undefined,
  spent: number | null | undefined,
): Spend {
  const plannedValue = planned ?? 0;
  const spentValue = spent ?? 0;

  return {
    remaining: plannedValue - spentValue,
    usage: plannedValue > 0 ? spentValue / plannedValue : null,
    isOver: spentValue > plannedValue,
  };
}

export function parseMoney(input: string): number | null {
  const normalized = input.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;

  return Number(normalized);
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';

  return `${FORMATTER.format(value)} zł`;
}
