export function todayInPoland() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(
    new Date(),
  );
}

export function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function warsawPartsOf(utcMs: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Warsaw',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') === 24 ? 0 : get('hour'),
    get('minute'),
    get('second'),
  );
}

export function warsawLocalToUtc(day: string, time: string) {
  const [year, month, dayOfMonth] = day.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const guess = Date.UTC(year, month - 1, dayOfMonth, hour, minute, 0);

  const offset = warsawPartsOf(guess) - guess;
  return new Date(guess - offset);
}
