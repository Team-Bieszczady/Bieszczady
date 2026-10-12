import { Link } from 'react-router';
import { Spinner } from '../../../../components/ui/Spinner';
import { useBudget } from '../../../budget/hooks/useBudget';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcGrandTotals,
  calcSpend,
  currentVersion,
  formatMoney,
} from '../../../budget/utils/budgetTotals';
import EmptySectionState from './EmptySectionState';
import OverviewSection from './OverviewSection';
import ProgressBar from '../ProgressBar';

interface BudgetSectionProps {
  projectId: string;
}

const CAPTION_TONE = {
  total: 'text-grayText',
  spent: 'font-semibold text-amberDark',
  left: 'text-grayText',
} as const;

const VALUE_TONE = {
  total: 'text-dark',
  spent: 'text-dark',
  left: 'text-darkGreen',
} as const;

export default function BudgetSection({ projectId }: BudgetSectionProps) {
  const budgetQuery = useBudget(projectId);
  const store = budgetQuery.data;

  if (!store) {
    return (
      <OverviewSection number={5} title="Budżet">
        {budgetQuery.isError ? (
          <EmptySectionState title="Nie udało się wczytać budżetu." />
        ) : (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}
      </OverviewSection>
    );
  }

  const version = currentVersion(store);
  const hasPositions = version.categories.some(
    (category) => category.positions.length > 0,
  );

  if (!hasPositions) {
    return (
      <OverviewSection number={5} title="Budżet">
        <EmptySectionState
          canEdit={store.permissions.canEdit}
          title={
            <>
              Uzupełnij budżet projektu w zakładce{' '}
              <Link
                to="/project/budget"
                className="font-medium text-darkGreen hover:underline"
              >
                Budżet
              </Link>
            </>
          }
          hint="Tutaj zobaczysz, ile z niego zostało wydane."
        />
      </OverviewSection>
    );
  }

  const totals = calcGrandTotals(
    version.categories,
    store.columns,
    store.actuals,
  );
  const planned = totals[PLANNED_COLUMN_ID] ?? 0;
  const spent = totals[SPENT_COLUMN_ID] ?? 0;
  const { remaining, usage } = calcSpend(planned, spent);
  const percent = usage === null ? 0 : Math.round(usage * 100);
  const tiles = [
    {
      id: 'total',
      label: 'Całkowity budżet',
      value: formatMoney(planned),
      caption: 'Budżet projektu',
    },
    {
      id: 'spent',
      label: 'Wydatki',
      value: formatMoney(spent),
      caption: `${percent}% wykorzystano`,
    },
    {
      id: 'left',
      label: 'Pozostało',
      value: formatMoney(remaining),
      caption: 'Do wydania',
    },
  ] as const;

  return (
    <OverviewSection number={5} title="Budżet">
      <div className="animate-fade-in grid gap-3 800:grid-cols-2 800:gap-4 xl:grid-cols-3">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50 800:px-5"
          >
            <p className="text-xs text-grayText">{tile.label}</p>
            <p className={`mt-1 text-sm font-bold ${VALUE_TONE[tile.id]}`}>
              {tile.value}
            </p>
            <p className={`mt-1 text-xs ${CAPTION_TONE[tile.id]}`}>
              {tile.caption}
            </p>
          </div>
        ))}
      </div>

      <div className="animate-fade-in mt-3 rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50 800:mt-4 800:px-6 800:py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-dark">
            Wykorzystanie budżetu
          </p>
          <p className="text-sm font-bold text-darkGreen">{percent}%</p>
        </div>
        <ProgressBar percent={Math.min(percent, 100)} className="mt-3" />
        <div className="mt-2.5 flex items-center justify-between text-xs text-grayText 800:mt-2">
          <span>Wydano {formatMoney(spent)}</span>
          <span>Budżet {formatMoney(planned)}</span>
        </div>
      </div>
    </OverviewSection>
  );
}
