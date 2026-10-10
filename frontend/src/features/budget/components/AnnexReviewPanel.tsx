import type { ReactNode } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import {
  POSITION_FORMS,
  pluralizePl,
  type PluralForms,
} from '../../../lib/pluralizePl';
import type { BudgetStore, BudgetVersion, PlanField } from '../types';
import {
  EMPTY_ACTUALS,
  SPENT_COLUMN_ID,
  calcPlanTotals,
  formatMoney,
  type VersionDiff,
} from '../utils/budgetTotals';

const CHANGED_AMOUNT_FORMS: PluralForms = [
  'zmieniona kwota',
  'zmienione kwoty',
  'zmienionych kwot',
];

const TOTAL_LABELS: Record<PlanField, string> = {
  planned: 'Budżet łącznie',
  grant: 'Dotacja',
  ownContribution: 'Wkład własny',
};

interface AnnexReviewPanelProps {
  store: BudgetStore;
  version: BudgetVersion;
  previous: BudgetVersion;
  diff: VersionDiff;
  actions?: ReactNode;
}

export function AnnexReviewPanel({
  store,
  version,
  previous,
  diff,
  actions,
}: AnnexReviewPanelProps) {
  const before = calcPlanTotals(previous.categories);
  const after = calcPlanTotals(version.categories);
  const spentOf = (positionId: string) =>
    Number(
      (store.actuals[positionId] ?? EMPTY_ACTUALS).values[SPENT_COLUMN_ID],
    ) || 0;
  const warnings = [
    ...version.categories.flatMap((category) =>
      category.positions
        .filter((position) => spentOf(position.id) > position.planned)
        .map(
          (position) =>
            `Poniesione w „${position.name}” (${formatMoney(spentOf(position.id))}) przekracza nowy plan (${formatMoney(position.planned)}).`,
        ),
    ),
    ...[...diff.removedPositions.values()].flat().flatMap((position) => {
      const actuals = store.actuals[position.id] ?? EMPTY_ACTUALS;
      return actuals.invoices.length > 0 || spentOf(position.id) > 0
        ? [
            `Usuwana pozycja „${position.name}” ma już wydatki (${formatMoney(spentOf(position.id))}). Przed akceptacją przenieś je do innej pozycji (włącz „Pokaż zmiany”).`,
          ]
        : [];
    }),
    ...(before.grant !== after.grant
      ? [
          `Zmienia się łączna kwota dotacji: ${formatMoney(before.grant)} → ${formatMoney(after.grant)}.`,
        ]
      : []),
  ];

  return (
    <section
      aria-label="Podsumowanie zmian"
      className="rounded-lg border border-gray-200 bg-white px-4 py-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold text-dark">
            Zmiany względem: {previous.name}
          </h2>
          <p className="mt-0.5 text-xs text-grayText">
            {diff.hasChanges
              ? `+${pluralizePl(diff.addedPositionIds.size, POSITION_FORMS)}, −${pluralizePl(diff.removedCount, POSITION_FORMS)}, ${pluralizePl(diff.changed.size, CHANGED_AMOUNT_FORMS)}`
              : 'Brak zmian względem obowiązującej wersji'}
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(Object.keys(TOTAL_LABELS) as PlanField[]).map((field) => (
          <div key={field}>
            <dt className="text-[11px] text-grayText">{TOTAL_LABELS[field]}</dt>
            <dd className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs tabular-nums">
              {before[field] === after[field] ? (
                <span className="font-semibold text-dark">
                  {formatMoney(after[field])}
                </span>
              ) : (
                <>
                  <span className="text-dark/50 line-through decoration-1">
                    {formatMoney(before[field])}
                  </span>
                  <span className="font-semibold text-amberDark">
                    → {formatMoney(after[field])}
                  </span>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {warnings.map((warning) => (
            <li
              key={warning}
              className="flex items-start gap-2 rounded-md bg-amberSoft px-3 py-2 text-[11px] text-amberDark"
            >
              <FiAlertTriangle
                className="mt-0.5 h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              />
              {warning}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
