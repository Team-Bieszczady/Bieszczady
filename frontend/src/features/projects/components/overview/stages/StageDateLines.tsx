import {
  FiCalendar,
  FiCheckCircle,
  FiCornerDownRight,
  FiPlayCircle,
} from 'react-icons/fi';
import { formatStageDate } from '../../../utils/isoDate';
import type { StageView } from '../../../utils/stageState';

interface StageDateLinesProps {
  view: StageView;
  startDate: string | null;
  className?: string;
}

export default function StageDateLines({
  view,
  startDate,
  className = '',
}: StageDateLinesProps) {
  return (
    <div className={className}>
      <div className="flex flex-col gap-2 text-xs text-grayText 800:flex-row 800:flex-wrap 800:items-center 800:gap-x-5 800:gap-y-2">
        {startDate && (
          <span className="flex items-center gap-1.5">
            <FiPlayCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Start:{' '}
            <span className="font-semibold text-dark">
              {formatStageDate(startDate)}
            </span>
          </span>
        )}

        <span className="flex items-center gap-1.5">
          <FiCalendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Termin:{' '}
          <span
            className={
              view.movedDeadline
                ? 'font-semibold text-dark/50 line-through decoration-1'
                : 'font-semibold text-dark'
            }
          >
            {formatStageDate(view.plannedDeadline)}
          </span>
        </span>

        {view.movedDeadline && (
          <span className="flex items-center gap-1.5 text-amberDark">
            <FiCornerDownRight
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            Przeniesiono:{' '}
            <span className="font-semibold">
              {formatStageDate(view.movedDeadline)}
            </span>
          </span>
        )}

        {view.completedAt && (
          <span
            className={`flex items-center gap-1.5 ${
              view.completionTone === 'late'
                ? 'text-amberDark'
                : 'text-darkGreen'
            }`}
          >
            <FiCheckCircle
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            Zakończono:{' '}
            <span className="font-semibold">
              {formatStageDate(view.completedAt)}
            </span>
          </span>
        )}
      </div>

      {view.movedNote && (
        <p className="mt-2 text-xs leading-relaxed text-grayText italic">
          „{view.movedNote}”
        </p>
      )}
    </div>
  );
}
