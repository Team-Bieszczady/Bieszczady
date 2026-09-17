function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function toIsoDate(iso: string): string {
  return iso.slice(0, 10);
}

function parseLocal(iso: string): Date {
  const [year, month, day] = toIsoDate(iso).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysIso(iso: string, days: number): string {
  const date = parseLocal(iso);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

export function diffInDays(fromIso: string, toIso: string): number {
  const diff = parseLocal(toIso).getTime() - parseLocal(fromIso).getTime();
  return Math.round(diff / 86_400_000);
}

export function startOfWeekIso(iso: string): string {
  const date = parseLocal(iso);
  return addDaysIso(iso, -((date.getDay() + 6) % 7));
}

export function endOfWeekIso(iso: string): string {
  return addDaysIso(startOfWeekIso(iso), 6);
}

export function startOfMonthIso(iso: string): string {
  return `${toIsoDate(iso).slice(0, 7)}-01`;
}

export function endOfMonthIso(iso: string): string {
  const date = parseLocal(iso);
  return todayIso(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

export function formatStageDate(iso: string): string {
  return parseLocal(iso).toLocaleDateString('pl-PL', DATE_OPTIONS);
}

export function formatShortDate(iso: string): string {
  const [, month, day] = toIsoDate(iso).split('-');
  return `${day}.${month}`;
}


export function formatNumericDate(iso: string): string {
  const [year, month, day] = toIsoDate(iso).split('-');
  return `${day}.${month}.${year}`;
}
