import { type ModuleKey } from '../../lib/modules';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  count?: number;
  module: ModuleKey;
}

const PLACEHOLDER_COUNTS = {
  projects: 3,
  tasks: 5,
} as const;

export const ORG_NAV_ITEMS: NavItem[] = [
  {
    id: 'projects',
    label: 'Projekty',
    path: '/projects',
    count: PLACEHOLDER_COUNTS.projects,
    module: 'PROJECTS',
  },
  { id: 'people', label: 'Ludzie', path: '/people', module: 'PEOPLE' },
  { id: 'calendar', label: 'Kalendarz', path: '/calendar', module: 'CALENDAR' },
  { id: 'decisions', label: 'Decyzje', path: '/decisions', module: 'DECISIONS' },
  { id: 'settings', label: 'Ustawienia', path: '/settings', module: 'SETTINGS' },
];

export const PROJECT_NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Przegląd',
    path: '/project/overview',
    module: 'OVERVIEW',
  },
  {
    id: 'tasks',
    label: 'Zadania',
    path: '/project/tasks',
    count: PLACEHOLDER_COUNTS.tasks,
    module: 'TASKS',
  },
  { id: 'budget', label: 'Budżet', path: '/project/budget', module: 'BUDGET' },
  {
    id: 'documents',
    label: 'Dokumenty',
    path: '/project/documents',
    module: 'DOCUMENTS',
  },
];

export const PLACEHOLDER_SELECTED_PROJECT = {
  name: 'Szlak rowerowy Solina–Polańczyk',
  status: 'w realizacji',
  description:
    '14 km trasy łączącej trzy miejscowości nad Soliną, z oznakowaniem i miejscami postojowymi.',
  stage: 'Etap 3/5',
};
