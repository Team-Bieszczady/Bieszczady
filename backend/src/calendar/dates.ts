export function todayInPoland() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw' }).format(
    new Date(),
  );
}

export function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}
