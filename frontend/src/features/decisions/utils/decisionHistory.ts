import type { BackendEvent } from '../../../lib/eventsApi';
import {
  addDaysIso,
  startOfMonthIso,
  todayIso,
} from '../../projects/utils/isoDate';
import type { DecisionPeriod } from '../constants';

export interface DecisionFilters {
  project: string;
  period: DecisionPeriod | '';
}

export const EMPTY_DECISION_FILTERS: DecisionFilters = {
  project: '',
  period: '',
};

export interface DecisionDayGroup {
  day: string;
  events: BackendEvent[];
}

function periodStart(period: DecisionPeriod, today: string): string {
  if (period === 'last7') return addDaysIso(today, -6);
  if (period === 'last30') return addDaysIso(today, -29);
  if (period === 'month') return startOfMonthIso(today);
  return `${today.slice(0, 4)}-01-01`;
}

/** The server compares against a real instant (`createdAt >= new Date(from)`),
 * so a bare `YYYY-MM-DD` would be read as midnight UTC and lop the first two
 * hours off the earliest Polish day. Send the local start of day instead. */
export function periodToFrom(period: DecisionPeriod | ''): string {
  if (!period) return '';

  const [year, month, day] = periodStart(period, todayIso())
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day).toISOString();
}

/** `createdAt` is a UTC instant, so the day key has to be derived in local
 * time — 01:00 in Poland is the previous day in UTC. */
function localDayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function groupByDay(events: BackendEvent[]): DecisionDayGroup[] {
  const groups: DecisionDayGroup[] = [];

  events.forEach((event) => {
    const day = localDayKey(event.createdAt);
    const current = groups.at(-1);

    if (current?.day === day) {
      current.events.push(event);
      return;
    }

    groups.push({ day, events: [event] });
  });

  return groups;
}
