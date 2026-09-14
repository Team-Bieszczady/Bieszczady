export type PluralForms = readonly [one: string, few: string, many: string];

export function polishForm(count: number): 0 | 1 | 2 {
  if (count === 1) return 0;

  const lastDigit = count % 10;
  const lastTwo = count % 100;
  const isFew =
    lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14);

  return isFew ? 1 : 2;
}

export function pluralizePl(count: number, forms: PluralForms): string {
  return `${count} ${forms[polishForm(count)]}`;
}

export const TASK_FORMS: PluralForms = ['zadanie', 'zadania', 'zadań'];
export const ACTION_FORMS: PluralForms = ['działanie', 'działania', 'działań'];
export const DAY_FORMS: PluralForms = ['dzień', 'dni', 'dni'];
export const STAGE_FORMS: PluralForms = ['etap', 'etapy', 'etapów'];
export const PROJECT_FORMS: PluralForms = ['projekt', 'projekty', 'projektów'];
