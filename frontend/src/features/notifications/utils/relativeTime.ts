type PluralForm = 0 | 1 | 2; 

function polishForm(n: number): PluralForm {
  if (n === 1) return 0;
  const last1 = n % 10;
  const last2 = n % 100;
  if (last1 >= 2 && last1 <= 4 && !(last2 >= 12 && last2 <= 14)) return 1;
  return 2;
}

const UNITS = {
  minute: ['minutę', 'minuty', 'minut'],
  hour: ['godzinę', 'godziny', 'godzin'],
  day: ['dzień', 'dni', 'dni'],
} as const;

function ago(n: number, unit: keyof typeof UNITS): string {
  return `${n} ${UNITS[unit][polishForm(n)]} temu`;
}

export function formatRelativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));

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

