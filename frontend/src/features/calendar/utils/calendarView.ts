import {
  addDaysIso,
  endOfMonthIso,
  formatStageDate,
  startOfMonthIso,
  startOfWeekIso,
} from '../../projects/utils/isoDate';
import { formatMonthTitle, getMonthGridDays } from './monthGrid';

export type CalendarView = 'day' | 'week' | 'month';

export const WEEKDAY_SHORT_NAMES = [
  'pon.',
  'wt.',
  'śr.',
  'czw.',
  'pt.',
  'sob.',
  'niedz.',
];

export function formatFullDay(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function weekDays(anchor: string) {
  const monday = startOfWeekIso(anchor);
  return Array.from({ length: 7 }, (_, index) => addDaysIso(monday, index));
}

export function visibleDays(view: CalendarView, anchor: string) {
  if (view === 'day') return [anchor];
  if (view === 'week') return weekDays(anchor);
  return getMonthGridDays(anchor);
}

export function shiftAnchor(view: CalendarView, anchor: string, step: 1 | -1) {
  if (view === 'day') return addDaysIso(anchor, step);
  if (view === 'week') return addDaysIso(anchor, step * 7);
  return step === 1
    ? addDaysIso(endOfMonthIso(anchor), 1)
    : startOfMonthIso(addDaysIso(startOfMonthIso(anchor), -1));
}

function dayAndMonth(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
  });
}

function formatWeekTitle(anchor: string) {
  const days = weekDays(anchor);
  const monday = days[0];
  const sunday = days[6];

  if (monday.slice(0, 7) === sunday.slice(0, 7)) {
    return `${Number(monday.slice(8))} – ${formatStageDate(sunday)}`;
  }
  if (monday.slice(0, 4) === sunday.slice(0, 4)) {
    return `${dayAndMonth(monday)} – ${formatStageDate(sunday)}`;
  }
  return `${formatStageDate(monday)} – ${formatStageDate(sunday)}`;
}

export function formatViewTitle(view: CalendarView, anchor: string) {
  if (view === 'day') return formatStageDate(anchor);
  if (view === 'week') return formatWeekTitle(anchor);
  return formatMonthTitle(anchor);
}
