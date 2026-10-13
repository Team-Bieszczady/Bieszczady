import { formatAmount, type ProjectTotal } from '../invoiceSummary';
import { pluralizePl, type PluralForms } from '../../../lib/pluralizePl';

const INVOICE_FORMS: PluralForms = ['faktura', 'faktury', 'faktur'];

interface ProjectTotalsSectionProps {
  totals: ProjectTotal[];
  activeProjectId: string | null;
  onPick: (projectId: string) => void;
}

export function ProjectTotalsSection({
  totals,
  activeProjectId,
  onPick,
}: ProjectTotalsSectionProps) {
  if (totals.length === 0) return null;

  const biggest = totals[0].amount;

  return (
    <section aria-label="Podział na projekty">
      <h2 className="mb-1 text-sm font-semibold text-dark">
        Podział na projekty
      </h2>
      <p className="mb-3 text-xs text-grayText">
        Ile z faktur przypada na każdy projekt. Kliknij, aby zobaczyć tylko jego
        faktury.
      </p>

      <ul className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {totals.map((total) => {
          const isActive = total.projectId === activeProjectId;

          return (
            <li
              key={total.projectId}
              className="border-b border-gray-100 last:border-b-0"
            >
              <button
                type="button"
                onClick={() => onPick(total.projectId)}
                aria-pressed={isActive}
                className={`w-full cursor-pointer border-l-2 px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'border-darkGreen bg-white'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span
                    className={`text-sm ${isActive ? 'font-medium text-darkGreen' : 'text-dark'}`}
                  >
                    {total.projectName}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap text-dark">
                    {formatAmount(total.amount)}
                    <span className="ml-2 text-xs font-normal text-grayText">
                      {pluralizePl(total.invoiceCount, INVOICE_FORMS)}
                    </span>
                  </span>
                </div>
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full bg-darkGreen"
                    style={{
                      width: `${biggest > 0 ? (total.amount / biggest) * 100 : 0}%`,
                    }}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
