import { minutesToTop, type NowMarker } from '../../utils/timeGrid';
import { GUTTER_CLASSES } from './layout';

const NOW_LABEL_CLEARANCE = 10;

interface HourGutterProps {
  hours: number[];
  firstHour: number;
  height: number;
  now: NowMarker | null;
}

export function HourGutter({ hours, firstHour, height, now }: HourGutterProps) {
  const isCoveredByNow = (top: number) =>
    now !== null && Math.abs(now.top - top) < NOW_LABEL_CLEARANCE;

  return (
    <div className={`relative ${GUTTER_CLASSES}`} style={{ height }}>
      {hours.map((hour) => {
        const top = minutesToTop(hour * 60, firstHour);
        if (isCoveredByNow(top)) return null;

        return (
          <span
            key={hour}
            className="absolute right-2 -translate-y-1/2 text-[11px] text-grayText"
            style={{ top }}
          >
            {hour}:00
          </span>
        );
      })}

      {now && (
        <span
          className="absolute right-2 -translate-y-1/2 text-[11px] font-semibold text-red-600"
          style={{ top: now.top }}
        >
          {now.label}
        </span>
      )}
    </div>
  );
}
