import { useId } from 'react';
import { pluralizePl, TASK_FORMS } from '../../../../../lib/pluralizePl';
import type { Stage } from '../../../types';
import type { StageView } from '../../../utils/stageState';
import ProgressBar from '../../ProgressBar';
import StageActionMenu from './StageActionMenu';
import StageDateLines from './StageDateLines';
import StageOverdueBadge from './StageOverdueBadge';
import StageStateBadge from './StageStateBadge';

interface StageCardProps {
  stage: Stage;
  view: StageView;
  index: number;
  canEdit: boolean;
  onEdit: () => void;
  onMoveDeadline: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function StageCard({
  stage,
  view,
  index,
  canEdit,
  ...handlers
}: StageCardProps) {
  const headingId = useId();

  return (
    <article
      id={`etap-${stage.id}`}
      aria-labelledby={headingId}
      className={`scroll-mt-24 rounded-xl border bg-white px-4 py-4 transition-colors hover:bg-gray-50 800:px-6 ${
        view.isOverdue
          ? 'border-darkRed/35'
          : view.status === 'in_progress'
            ? 'border-darkGreen/40'
            : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.5px] text-mutedText">
            ETAP {index + 1}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <h3
              id={headingId}
              className="text-sm font-bold text-dark 800:text-base"
            >
              {stage.name}
            </h3>
            <StageStateBadge status={view.status} />
            {view.isOverdue && <StageOverdueBadge />}
          </div>
        </div>

        {canEdit && <StageActionMenu stage={stage} view={view} {...handlers} />}
      </div>

      {stage.description && (
        <p className="mt-1 max-w-2xl text-xs text-grayText 800:text-sm">
          {stage.description}
        </p>
      )}

      {view.counts.total === 0 ? (
        <p className="mt-4 text-xs text-mutedText">
          Brak zadań w tym etapie — pozostanie otwarty, dopóki zadania nie
          zostaną dodane i ukończone.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 800:flex-nowrap">
          <span className="shrink-0 text-xs text-grayText">Postęp</span>
          <span className="ml-auto shrink-0 text-xs font-semibold text-dark 800:order-2 800:ml-0 800:text-sm">
            {view.counts.done}/{pluralizePl(view.counts.total, TASK_FORMS)}
          </span>
          <span className="shrink-0 text-xs font-bold text-darkGreen 800:order-3 800:text-sm">
            {view.percent}%
          </span>
          <ProgressBar
            percent={view.percent}
            ariaLabel={`Postęp etapu ${stage.name}`}
            className="basis-full 800:order-1 800:basis-auto 800:flex-1"
          />
        </div>
      )}

      <StageDateLines
        view={view}
        startDate={stage.startDate}
        className="mt-4 border-t border-gray-100 pt-3"
      />
    </article>
  );
}
