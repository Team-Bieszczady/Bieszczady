const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
};

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

export function calendarDaysAgo(date: Date, now: Date = new Date()): number {
  const diff = startOfLocalDay(now) - startOfLocalDay(date);
  return Math.round(diff / 86_400_000);
}

export function formatDate(iso: string | null, fallback = 'Nigdy'): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleDateString('pl-PL', DATE_OPTIONS);
}

export function formatAbsoluteDateTime(iso: string | null): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleString('pl-PL', {
    ...DATE_OPTIONS,
    ...TIME_OPTIONS,
  });
}

export function formatLastLogin(
  iso: string | null,
  now: Date = new Date(),
): string {
  if (!iso) return 'Nigdy';

  const date = new Date(iso);
  const time = date.toLocaleTimeString('pl-PL', TIME_OPTIONS);
  const days = calendarDaysAgo(date, now);

  if (days <= 0) return `dziś, ${time}`;
  if (days === 1) return `wczoraj, ${time}`;
  if (days <= 10) return `${days} dni temu, ${time}`;

  return formatDate(iso);
}
