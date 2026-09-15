import {
  endOfMonthIso,
  endOfWeekIso,
  startOfMonthIso,
  startOfWeekIso,
} from './isoDate';

export type SchedulePeriod = 'week' | 'month' | 'all';

export interface SchedulePeriodOption {
  id: SchedulePeriod;
  label: string;
}

export const SCHEDULE_PERIODS: SchedulePeriodOption[] = [
  { id: 'week', label: 'Ten tydzień' },
  { id: 'month', label: 'Ten miesiąc' },
  { id: 'all', label: 'Cały projekt' },
];

export interface PeriodRange {
  from: string;
  to: string;
}

export function periodRange(
  period: SchedulePeriod,
  today: string,
): PeriodRange | null {
  if (period === 'week') {
    return { from: startOfWeekIso(today), to: endOfWeekIso(today) };
  }
  if (period === 'month') {
    return { from: startOfMonthIso(today), to: endOfMonthIso(today) };
  }
  return null;
}

export function isInPeriod(
  dueDate: string | null,
  period: SchedulePeriod,
  today: string,
): boolean {
  const range = periodRange(period, today);
  if (!range) return true;
  if (!dueDate) return false;

  return dueDate >= range.from && dueDate <= range.to;
}
