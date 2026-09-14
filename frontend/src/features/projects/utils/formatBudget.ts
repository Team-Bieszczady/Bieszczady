const FORMATTER = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 0,
});

export function formatBudget(budgetAmount: string | null): string {
  if (!budgetAmount) return 'brak danych';

  const value = Number(budgetAmount);
  if (Number.isNaN(value)) return 'brak danych';

  return `${FORMATTER.format(value)} zł`;
}
