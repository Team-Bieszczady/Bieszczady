import { type ModuleKey } from '../../lib/modules';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  count?: number;
  module?: ModuleKey;
  directorOnly?: boolean;
}

export const ORG_NAV_ITEMS: NavItem[] = [
  { id: 'projects', label: 'Projekty', path: '/projects', module: 'PROJECTS' },
  { id: 'people', label: 'Ludzie', path: '/people', module: 'PEOPLE' },
  { id: 'calendar', label: 'Kalendarz', path: '/calendar', module: 'CALENDAR' },
  {
    id: 'decisions',
    label: 'Decyzje',
    path: '/decisions',
    module: 'DECISIONS',
  },
  { id: 'partners', label: 'Partnerzy', path: '/partners', directorOnly: true },
  {
    id: 'settings',
    label: 'Archiwum',
    path: '/settings',
    module: 'SETTINGS',
  },
];

export const PROJECT_NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Przegląd',
    path: '/project/overview',
    module: 'OVERVIEW',
  },
  { id: 'tasks', label: 'Zadania', path: '/project/tasks', module: 'TASKS' },
  { id: 'budget', label: 'Budżet', path: '/project/budget', module: 'BUDGET' },
  {
    id: 'documents',
    label: 'Dokumenty',
    path: '/project/documents',
    module: 'DOCUMENTS',
  },
];
