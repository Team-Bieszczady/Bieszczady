export interface BudgetTile {
  id: 'total' | 'spent' | 'left';
  label: string;
  value: string;
  caption: string;
}

export interface BudgetPlaceholder {
  tiles: BudgetTile[];
  percent: number;
  spentLabel: string;
  totalLabel: string;
}

export const PLACEHOLDER_BUDGET: BudgetPlaceholder = {
  tiles: [
    {
      id: 'total',
      label: 'Całkowity budżet',
      value: '48 000 zł',
      caption: 'Budżet projektu',
    },
    {
      id: 'spent',
      label: 'Wydatki',
      value: '32 400 zł',
      caption: '68% wykorzystano',
    },
    {
      id: 'left',
      label: 'Pozostało',
      value: '15 600 zł',
      caption: 'Do wydania',
    },
  ],
  percent: 68,
  spentLabel: 'Wydano 32 400 zł',
  totalLabel: 'Budżet 48 000 zł',
};
