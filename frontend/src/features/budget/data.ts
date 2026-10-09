import type { RadioPillOption } from '../../components/ui/RadioPillGroup';
import type { BudgetState, BudgetVersion, Position } from './types';

export const COLUMN_TYPE_OPTIONS: RadioPillOption[] = [
  { value: 'text', label: 'Tekst' },
  { value: 'money', label: 'Kwota' },
];

function position(
  id: string,
  name: string,
  person: string,
  source: string,
  planned: number,
  incurred: number,
  grant: number,
  ownContribution: number,
): Position {
  return {
    id,
    name,
    values: { person, source, planned, incurred, grant, ownContribution },
  };
}

export const INITIAL_BUDGET: BudgetState = {
  columns: [
    { id: 'planned', name: 'Plan', type: 'money', locked: true },
    { id: 'incurred', name: 'Poniesione', type: 'money', locked: true },
    {
      id: 'person',
      name: 'Osoba odpowiedzialna',
      type: 'text',
      locked: false,
    },
    { id: 'source', name: 'Źródło finansowania', type: 'text', locked: false },
    { id: 'grant', name: 'Dotacja', type: 'money', locked: false },
    {
      id: 'ownContribution',
      name: 'Wkład własny',
      type: 'money',
      locked: false,
    },
  ],
  categories: [
    {
      id: 'programme',
      name: 'Działania programowe',
      expanded: true,
      positions: [
        position(
          'shelter',
          'Zbudowanie wiaty',
          'Anna Kowalczyk',
          'Dotacja PROW',
          100000,
          62000,
          85000,
          15000,
        ),
        position(
          'site',
          'Przygotowanie terenu',
          'Marek Nowak',
          'Dotacja PROW',
          50000,
          50000,
          42500,
          7500,
        ),
        position(
          'equipment',
          'Wyposażenie wiaty',
          'Ewa Mazur',
          'Wkład własny gminy',
          50000,
          0,
          0,
          50000,
        ),
      ],
    },
    {
      id: 'signage',
      name: 'Oznakowanie szlaku',
      expanded: true,
      positions: [
        position(
          'boards',
          'Tablice informacyjne',
          'Piotr Wójcik',
          'Dotacja PROW',
          18000,
          18450,
          15300,
          2700,
        ),
        position(
          'signs',
          'Znaki kierunkowe',
          'Piotr Wójcik',
          'Dotacja PROW',
          9500,
          4200,
          8075,
          1425,
        ),
      ],
    },
    {
      id: 'promotion',
      name: 'Promocja i wydarzenia',
      expanded: true,
      positions: [
        position(
          'festival',
          'Festyn otwarcia szlaku',
          'Katarzyna Lis',
          'Dotacja PROW',
          20000,
          12000,
          17000,
          3000,
        ),
        position(
          'materials',
          'Materiały promocyjne',
          'Katarzyna Lis',
          'Dotacja PROW',
          15000,
          15000,
          12750,
          2250,
        ),
      ],
    },
    {
      id: 'admin',
      name: 'Koszty administracyjne',
      expanded: true,
      positions: [
        position(
          'coordination',
          'Koordynacja projektu',
          'Anna Kowalczyk',
          'Wkład własny',
          30000,
          36200,
          0,
          30000,
        ),
      ],
    },
  ],
};

export const INITIAL_VERSIONS: BudgetVersion[] = [
  { id: 'base', label: 'Wersja podstawowa', budget: INITIAL_BUDGET },
  { id: 'annex-1', label: 'Aneks 1', budget: INITIAL_BUDGET },
  { id: 'annex-2', label: 'Aneks 2', budget: INITIAL_BUDGET },
];
