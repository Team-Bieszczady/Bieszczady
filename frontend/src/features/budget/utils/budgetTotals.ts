import type {
  BudgetStore,
  BudgetVersion,
  Column,
  PlanCategory,
  PlanField,
  PlanPosition,
  PositionActuals,
} from '../types';

export type Totals = Record<string, number | null>;

const FORMATTER = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 2,
  useGrouping: 'always',
});

export const PLANNED_COLUMN_ID = 'planned';
export const SPENT_COLUMN_ID = 'incurred';
export const PLAN_FIELDS: readonly PlanField[] = [
  'planned',
  'grant',
  'ownContribution',
];

export const EMPTY_ACTUALS: PositionActuals = {
  values: {},
  invoices: [],
  status: null,
  document: null,
};

export function isPlanField(columnId: string): columnId is PlanField {
  return (PLAN_FIELDS as readonly string[]).includes(columnId);
}

export function positionValues(
  position: PlanPosition,
  actuals: Record<string, PositionActuals>,
): Record<string, string | number> {
  return {
    ...(actuals[position.id] ?? EMPTY_ACTUALS).values,
    planned: position.planned,
    grant: position.grant,
    ownContribution: position.ownContribution,
  };
}

export function calcCategoryTotals(
  category: PlanCategory,
  columns: Column[],
  actuals: Record<string, PositionActuals>,
): Totals {
  const totals: Totals = {};
  const rows = category.positions.map((position) =>
    positionValues(position, actuals),
  );

  for (const column of columns) {
    if (column.type !== 'money') continue;

    totals[column.id] =
      rows.length === 0
        ? null
        : rows.reduce(
            (sum, values) => sum + (Number(values[column.id]) || 0),
            0,
          );
  }

  return totals;
}

export function calcGrandTotals(
  categories: PlanCategory[],
  columns: Column[],
  actuals: Record<string, PositionActuals>,
): Totals {
  const totals: Totals = {};
  const categoryTotals = categories.map((category) =>
    calcCategoryTotals(category, columns, actuals),
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

export function calcPlanTotals(
  categories: PlanCategory[],
): Record<PlanField, number> {
  const totals = { planned: 0, grant: 0, ownContribution: 0 };

  for (const category of categories) {
    for (const position of category.positions) {
      for (const field of PLAN_FIELDS) totals[field] += position[field];
    }
  }

  return totals;
}

export function calcInvoicesTotal(actuals: PositionActuals): number {
  return actuals.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
}

export interface VersionDiff {
  addedCategoryIds: Set<string>;
  removedCategories: PlanCategory[];
  addedPositionIds: Set<string>;
  removedPositions: Map<string, PlanPosition[]>;
  changed: Map<string, Partial<Record<PlanField, number>>>;
  hasChanges: boolean;
  removedCount: number;
}

export function diffVersions(
  previous: PlanCategory[],
  next: PlanCategory[],
): VersionDiff {
  const previousCategories = new Map(previous.map((c) => [c.id, c]));
  const nextCategoryIds = new Set(next.map((c) => c.id));
  const previousPositions = new Map(
    previous.flatMap((c) => c.positions.map((p) => [p.id, p] as const)),
  );
  const nextPositionIds = new Set(
    next.flatMap((c) => c.positions.map((p) => p.id)),
  );

  const addedCategoryIds = new Set(
    next.filter((c) => !previousCategories.has(c.id)).map((c) => c.id),
  );
  const removedCategories = previous.filter((c) => !nextCategoryIds.has(c.id));
  const addedPositionIds = new Set(
    [...nextPositionIds].filter((id) => !previousPositions.has(id)),
  );
  const removedPositions = new Map<string, PlanPosition[]>();
  let removedCount = 0;

  for (const category of previous) {
    const removed = category.positions.filter(
      (p) => !nextPositionIds.has(p.id),
    );
    if (removed.length === 0) continue;

    removedPositions.set(category.id, removed);
    removedCount += removed.length;
  }

  const changed = new Map<string, Partial<Record<PlanField, number>>>();
  for (const category of next) {
    for (const position of category.positions) {
      const before = previousPositions.get(position.id);
      if (!before) continue;

      const fields: Partial<Record<PlanField, number>> = {};
      for (const field of PLAN_FIELDS) {
        if (before[field] !== position[field]) fields[field] = before[field];
      }
      if (Object.keys(fields).length > 0) changed.set(position.id, fields);
    }
  }

  return {
    addedCategoryIds,
    removedCategories,
    addedPositionIds,
    removedPositions,
    changed,
    removedCount,
    hasChanges:
      addedCategoryIds.size > 0 ||
      removedCategories.length > 0 ||
      addedPositionIds.size > 0 ||
      removedCount > 0 ||
      changed.size > 0,
  };
}

export function currentVersion(store: BudgetStore): BudgetVersion {
  return (
    store.versions.find((version) => version.isCurrent) ?? store.versions[0]
  );
}

export function previousVersion(
  store: BudgetStore,
  version: BudgetVersion,
): BudgetVersion | null {
  if (version.status !== 'APPROVED') return currentVersion(store);

  return (
    store.versions
      .filter(
        (candidate) =>
          candidate.status === 'APPROVED' && candidate.number < version.number,
      )
      .sort((a, b) => b.number - a.number)[0] ?? null
  );
}

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
