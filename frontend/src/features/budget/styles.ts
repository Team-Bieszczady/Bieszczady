import type { Column } from './types';

export const TH_CLASSES =
  'whitespace-nowrap px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600';

export const MENU_REVEAL_CLASSES =
  'lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 lg:aria-expanded:opacity-100';

export function moneyEmphasis(column: Column): string {
  return column.id === 'incurred' ? 'font-bold' : 'font-normal text-gray-600';
}
