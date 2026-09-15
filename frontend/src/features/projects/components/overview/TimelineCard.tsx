import type { ReactNode } from 'react';
import { DAY_FORMS, pluralizePl } from '../../../../lib/pluralizePl';
import type { Stage } from '../../types';
import { diffInDays, formatStageDate, todayIso } from '../../utils/isoDate';
import type { StageView } from '../../utils/stageState';
import StageMarkerDates from './stages/StageMarkerDates';

interface TimelineCardProps {
  stages: Stage[];
  views: StageView[];
  startDate: string | null;
  plannedEndDate: string | null;
  children?: ReactNode;
}

const NOT_SET = 'Nie ustawiono';

function remainingLabel(plannedEndDate: string | null): string {
  if (!plannedEndDate) return 'Brak daty zakończenia';

  const days = diffInDays(todayIso(), plannedEndDate);
  if (days > 0) return `Pozostało ${pluralizePl(days, DAY_FORMS)}`;
  if (days === 0) return 'Ostatni dzień';
  return `Po terminie o ${pluralizePl(Math.abs(days), DAY_FORMS)}`;
}

function DateBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-grayText">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-dark">{value}</p>
    </div>
  );
}

function markerDotClass(view: StageView, isDesktop: boolean): string {
  if (view.status === 'completed') return 'bg-darkGreen';
  if (view.isOverdue) {
    return isDesktop ? 'bg-darkRed' : 'border-4 border-darkRed bg-white';
  }
  if (view.status === 'in_progress') {
    return isDesktop ? 'bg-trackGray' : 'border-4 border-darkGreen bg-white';
  }
  return isDesktop ? 'bg-trackGray' : 'border-2 border-trackGray bg-white';
}

function MarkerLink({
  stage,
  view,
  isDesktop,
}: {
  stage: Stage;
  view: StageView;
  isDesktop: boolean;
}) {
  return (
    <a
      href={`#etap-${stage.id}`}
      aria-label={`Przejdź do etapu ${stage.name}`}
      className={`relative block shrink-0 rounded-full transition-transform duration-150 before:absolute before:-inset-2.5 before:content-[''] hover:scale-125 focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:ring-offset-2 focus-visible:outline-none ${
        isDesktop ? 'h-3.5 w-3.5' : 'z-10 mt-0.5 h-4 w-4'
      } ${markerDotClass(view, isDesktop)}`}
    />
  );
}

function labelClass(view: StageView, base: string): string {
  if (view.isOverdue) return `${base} text-darkRed`;
  if (view.status === 'completed' || view.status === 'in_progress') {
    return `${base} text-dark`;
  }
  return `${base} text-mutedText`;
}

function connectorClass(next: StageView | undefined): string {
  return next?.status === 'completed' ? 'bg-darkGreen' : 'bg-trackGray';
}

export default function TimelineCard({
  stages,
  views,
  startDate,
  plannedEndDate,
  children,
}: TimelineCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-5 800:px-6">
      <div className="flex flex-col gap-4 800:flex-row 800:flex-wrap 800:items-start 800:justify-between 800:gap-6">
        <p className="text-[17px] font-bold text-darkGreen 800:text-lg lg:text-xl">
          {remainingLabel(plannedEndDate)}
        </p>
        <div className="flex gap-8">
          <DateBlock
            label="Data startu"
            value={startDate ? formatStageDate(startDate) : NOT_SET}
          />
          <DateBlock
            label="Data zakończenia"
            value={plannedEndDate ? formatStageDate(plannedEndDate) : NOT_SET}
          />
        </div>
      </div>

      {stages.length > 0 && (
        <ol
          className="animate-fade-in mt-6 flex flex-col 800:hidden"
          aria-label="Oś czasu etapów"
        >
          {stages.map((stage, index) => {
            const view = views[index];
            const isLast = index === stages.length - 1;

            return (
              <li
                key={stage.id}
                className={`flex gap-3.5 ${isLast ? '' : 'pb-5'}`}
              >
                <div className="relative flex w-4.5 shrink-0 justify-center">
                  <MarkerLink stage={stage} view={view} isDesktop={false} />
                  {!isLast && (
                    <span
                      className={`absolute top-4 -bottom-1 left-1/2 w-0.5 -translate-x-1/2 ${connectorClass(
                        views[index + 1],
                      )}`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={labelClass(
                      view,
                      'text-sm leading-tight font-bold',
                    )}
                  >
                    {stage.name}
                  </p>
                  <StageMarkerDates view={view} variant="mobile" />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {stages.length > 0 && (
        <ol
          className="animate-fade-in mt-6 hidden items-start 800:flex"
          aria-label="Oś czasu etapów"
        >
          {stages.map((stage, index) => {
            const view = views[index];

            return (
              <li
                key={stage.id}
                className="flex min-w-0 flex-1 flex-col items-center last:w-24 last:flex-none"
              >
                <div className="flex w-full items-center">
                  <MarkerLink stage={stage} view={view} isDesktop />
                  {index < stages.length - 1 && (
                    <span
                      className={`h-0.75 flex-1 rounded-sm ${connectorClass(
                        views[index + 1],
                      )}`}
                    />
                  )}
                </div>
                <p
                  className={labelClass(
                    view,
                    'mt-2 w-full truncate pr-4 text-xs font-semibold',
                  )}
                >
                  {stage.name}
                </p>
                <StageMarkerDates view={view} variant="desktop" />
              </li>
            );
          })}
        </ol>
      )}

      {children}
    </div>
  );
}
