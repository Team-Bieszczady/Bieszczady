export const PERIOD_FILTER_OPTIONS = [
  { value: 'last7', label: 'Ostatnie 7 dni' },
  { value: 'last30', label: 'Ostatnie 30 dni' },
  { value: 'month', label: 'Ten miesiąc' },
  { value: 'year', label: 'Ten rok' },
] as const;

export type DecisionPeriod = (typeof PERIOD_FILTER_OPTIONS)[number]['value'];
