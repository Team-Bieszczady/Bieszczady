import { FiDownload, FiCalendar, FiUser, FiMoreVertical } from 'react-icons/fi';
import { Button } from '../../../../components/ui/Button';
import { PLACEHOLDER_INDICATORS } from '../../placeholders';
import EmptySectionState from './EmptySectionState';
import OverviewSection from './OverviewSection';
import ProgressBar from '../ProgressBar';

interface IndicatorsSectionProps {
  canEdit: boolean;
}

export default function IndicatorsSection({
  canEdit,
}: IndicatorsSectionProps) {
  const indicators = PLACEHOLDER_INDICATORS;

  return (
    <OverviewSection
      number={3}
      title="Wskaźniki projektowe"
      actions={
        <>
          <Button
            variant="outline"
            size="small"
            className="flex items-center gap-2 text-xs max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1"
          >
            <FiDownload className="h-3.5 w-3.5" aria-hidden="true" />
            Importuj z tabeli
          </Button>
          <Button
            variant="primary"
            size="small"
            className="text-xs max-lg:h-7 max-lg:px-4 max-lg:py-1"
          >
            + Dodaj wskaźnik
          </Button>
        </>
      }
    >
      {indicators.length === 0 ? (
        <EmptySectionState
          title="Dodaj wskaźniki do projektu"
          hint="Wskaźniki pokazują, po czym poznasz, że cele zostały osiągnięte."
          canEdit={canEdit}
        />
      ) : (
        <div className="animate-fade-in flex flex-col gap-3">
          {indicators.map((indicator) => (
            <article
              key={indicator.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50 800:px-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-sm font-bold text-dark 800:text-base">
                  {indicator.title}
                </h3>
                <button
                  type="button"
                  aria-label="Więcej opcji"
                  className="-mr-1 shrink-0 cursor-pointer rounded-md p-1 text-grayText transition-colors hover:bg-gray-100 hover:text-dark"
                >
                  <FiMoreVertical className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <p className="mt-1 max-w-2xl text-xs text-grayText 800:text-sm">
                {indicator.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 800:flex-nowrap">
                <span className="shrink-0 text-xs text-grayText">Postęp</span>
                <span className="ml-auto shrink-0 text-xs font-semibold text-dark 800:order-2 800:ml-0 800:text-sm">
                  {indicator.ratio}
                </span>
                <span className="shrink-0 text-xs font-bold text-darkGreen 800:order-3 800:text-sm">
                  {indicator.percent}%
                </span>
                <ProgressBar
                  percent={indicator.percent}
                  className="basis-full 800:order-1 800:basis-auto 800:flex-1"
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3 text-xs text-grayText">
                <span className="flex items-center gap-1.5">
                  <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />
                  Termin:{' '}
                  <span className="font-semibold text-dark">
                    {indicator.deadline}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <FiUser className="h-3.5 w-3.5" aria-hidden="true" />
                  {indicator.owner}
                </span>
                <span className="basis-full cursor-pointer font-semibold text-darkGreen hover:underline 800:ml-auto 800:basis-auto">
                  Dokumenty ({indicator.documentsCount}) →
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </OverviewSection>
  );
}
