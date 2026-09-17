import { formatStageDate } from '../../../utils/isoDate';
import type { StageView } from '../../../utils/stageState';
import StageOverdueBadge from './StageOverdueBadge';

interface StageMarkerDatesProps {
  view: StageView;
  variant: 'mobile' | 'desktop';
}

const VARIANT = {
  mobile: {
    wrapper: 'mt-1 flex flex-col items-start gap-0.5',
    deadline: 'text-xs text-mutedText',
    moved: 'text-[11px] font-semibold text-amberDark',
    onTime: 'text-[11px] font-semibold text-darkGreen',
    late: 'text-[11px] font-semibold text-amberDark',
    badge: 'default',
  },
  desktop: {
    wrapper: 'mt-0.5 flex w-full flex-col items-start gap-0.5 pr-4',
    deadline: 'text-[9px] font-semibold text-dark/50',
    moved: 'text-[9px] font-semibold text-amberDark',
    onTime: 'text-[9px] font-semibold text-darkGreen',
    late: 'text-[9px] font-semibold text-amberDark',
    badge: 'micro',
  },
} as const;

export default function StageMarkerDates({
  view,
  variant,
}: StageMarkerDatesProps) {
  const style = VARIANT[variant];

  return (
    <div className={style.wrapper}>
      <p
        className={
          view.movedDeadline
            ? `${style.deadline} line-through decoration-1`
            : style.deadline
        }
      >
        {formatStageDate(view.plannedDeadline)}
      </p>

      {view.movedDeadline && (
        <p className={style.moved}>
          Przeniesiono {formatStageDate(view.movedDeadline)}
        </p>
      )}

      {view.completedAt && (
        <p
          className={view.completionTone === 'late' ? style.late : style.onTime}
        >
          Zakończono {formatStageDate(view.completedAt)}
        </p>
      )}

      {view.isOverdue && (
        <StageOverdueBadge size={style.badge} className="mt-0.5" />
      )}
    </div>
  );
}
