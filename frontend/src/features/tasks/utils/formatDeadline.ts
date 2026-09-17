import { DAY_FORMS, pluralizePl } from '../../../lib/pluralizePl';
import { diffInDays, formatNumericDate } from '../../projects/utils/isoDate';

export type DeadlineTone = 'overdue' | 'soon' | 'calm';

export interface DeadlineView {
  date: string;
  relative: string;
  tone: DeadlineTone;
  isInherited: boolean;
}

const SOON_DAYS = 7;

export function describeDeadline(
  effectiveDueDate: string,
  today: string,
  options: { isDone?: boolean; isInherited?: boolean } = {},
): DeadlineView {
  const days = diffInDays(today, effectiveDueDate);
  const isDone = options.isDone ?? false;

  const relative =
    days === 0
      ? 'dziś'
      : days > 0
        ? `za ${pluralizePl(days, DAY_FORMS)}`
        : `${pluralizePl(-days, DAY_FORMS)} po terminie`;

  const tone: DeadlineTone = isDone
    ? 'calm'
    : days < 0
      ? 'overdue'
      : days <= SOON_DAYS
        ? 'soon'
        : 'calm';

  return {
    date: formatNumericDate(effectiveDueDate),
    relative,
    tone,
    isInherited: options.isInherited ?? false,
  };
}

export const DEADLINE_TONE_CLASSES: Record<DeadlineTone, string> = {
  overdue: 'text-darkRed font-medium',
  soon: 'text-amberDark',
  calm: 'text-grayText',
};
