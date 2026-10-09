import { minutesToTop, type NowMarker } from '../../utils/timeGrid';
import { GUTTER_CLASSES } from './layout';

const NOW_LABEL_CLEARANCE = 18;

interface HourGutterProps {
  hours: number[];
  firstHour: number;
  height: number;
  now: NowMarker | null;
}

export function HourGutter({ hours, firstHour, height, now }: HourGutterProps) {
  const isCoveredByNow = (labelTop: number) =>
    now !== null && Math.abs(now.top - labelTop) < NOW_LABEL_CLEARANCE;

  return (
    <div className={`relative ${GUTTER_CLASSES}`} style={{ height }}>
      {hours.slice(1).map((hour) => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-gray-200"
          style={{ top: minutesToTop(hour * 60, firstHour) }}
        />
      ))}

      {hours.map((hour) => {
        const labelTop = minutesToTop(hour * 60 + 30, firstHour);
        if (isCoveredByNow(labelTop)) return null;

        return (
          <span
            key={hour}
            className="absolute right-3 -translate-y-1/2 text-xs text-gray-400"
            style={{ top: labelTop }}
          >
            {hour}:00
          </span>
        );
      })}

      {now && (
        <span
          className="absolute right-3 -translate-y-1/2 text-[11px] font-semibold text-darkRed"
          style={{ top: now.top }}
        >
          {now.label}
        </span>
      )}
    </div>
  );
}
