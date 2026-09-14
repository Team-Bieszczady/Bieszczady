import { Link } from 'react-router';
import { PLACEHOLDER_BUDGET } from '../../placeholders';
import EmptySectionState from './EmptySectionState';
import OverviewSection from './OverviewSection';
import ProgressBar from '../ProgressBar';

interface BudgetSectionProps {
  canEdit: boolean;
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

export default function BudgetSection({ canEdit }: BudgetSectionProps) {
  const budget = PLACEHOLDER_BUDGET;

  if (budget.tiles.length === 0) {
    return (
      <OverviewSection number={5} title="Budżet">
        <EmptySectionState
          canEdit={canEdit}
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

  return (
    <OverviewSection number={5} title="Budżet">
      <div className="animate-fade-in grid gap-3 800:grid-cols-2 800:gap-4 xl:grid-cols-3">
        {budget.tiles.map((tile) => (
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
          <p className="text-sm font-bold text-darkGreen">{budget.percent}%</p>
        </div>
        <ProgressBar percent={budget.percent} className="mt-3" />
        <div className="mt-2.5 flex items-center justify-between text-xs text-grayText 800:mt-2">
          <span>{budget.spentLabel}</span>
          <span>{budget.totalLabel}</span>
        </div>
      </div>
    </OverviewSection>
  );
}
