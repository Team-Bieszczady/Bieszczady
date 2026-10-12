import { DAY_FORMS, pluralizePl, type PluralForms } from '../../../lib/pluralizePl';

const UNITS: Record<'minute' | 'hour' | 'day', PluralForms> = {
  minute: ['minutę', 'minuty', 'minut'],
  hour: ['godzinę', 'godziny', 'godzin'],
  day: DAY_FORMS,
};

function ago(n: number, unit: keyof typeof UNITS): string {
  return `${pluralizePl(n, UNITS[unit])} temu`;
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 1000),
  );

  if (seconds < 60) return 'przed chwilą';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return ago(minutes, 'minute');

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return ago(hours, 'hour');

  const days = Math.floor(hours / 24);
  if (days < 7) return ago(days, 'day');

  return new Date(iso).toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'long',
  });
}
