import {
  addDaysIso,
  endOfMonthIso,
  endOfWeekIso,
  startOfMonthIso,
  startOfWeekIso,
} from '../../projects/utils/isoDate';
import type { Deadline, Meeting } from '../types';

export const getMonthGridDays = (date: string) => {
  const monthDays: string[] = [];
  const firstDay = startOfWeekIso(startOfMonthIso(date));
  const lastDay = endOfWeekIso(endOfMonthIso(date));
  let current = firstDay;
  while (current <= lastDay) {
    monthDays.push(current);
    current = addDaysIso(current, 1);
  }
  return monthDays;
};

export const formatMonthTitle = (date: string) => {
  const year = date.slice(0, 4);
  const month = date.slice(5, 7);

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    'pl-PL',
    { month: 'long', year: 'numeric' },
  );
};
export const dayNumber = (date: string) => {
  const day = date.slice(-2);
  if (day[0] === '0') {
    return day[1];
  } else {
    return day;
  }
};

export function dayNumberClasses(
  isToday: boolean,
  isWeekend: boolean,
  isOutsideMonth = false,
) {
  if (isToday) return 'bg-dark font-semibold text-white';
  if (isOutsideMonth) return 'text-gray-300 hover:bg-gray-100';
  if (isWeekend) return 'text-gray-400 hover:bg-gray-100';
  return 'text-dark hover:bg-gray-100';
}

export const meetingsOnDay = (meetings: Meeting[], day: string): Meeting[] => {
  const dayMeetings = meetings
    .filter((el) => el.date === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return dayMeetings;
};

export const deadlinesOnDay = (
  deadlines: Deadline[],
  day: string,
): Deadline[] => deadlines.filter((deadline) => deadline.date === day);

const MONTH_CELL_ROWS = 3;

export const monthCellEntries = (
  meetings: Meeting[],
  deadlines: Deadline[],
  day: string,
) => {
  const dayDeadlines = deadlinesOnDay(deadlines, day);
  const dayMeetings = meetingsOnDay(meetings, day);
  const total = dayDeadlines.length + dayMeetings.length;
  const shown = total <= MONTH_CELL_ROWS ? total : MONTH_CELL_ROWS - 1;

  const visibleDeadlines = dayDeadlines.slice(0, shown);
  const visibleMeetings = dayMeetings.slice(0, shown - visibleDeadlines.length);
  const hiddenCount = total - visibleDeadlines.length - visibleMeetings.length;

  return { visibleDeadlines, visibleMeetings, hiddenCount };
};
