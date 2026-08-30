import type { PersonStatus } from './data';

export const ROLE_OPTIONS = ['Koordynator', 'Wykonawca', 'Partner'] as const;

export type RoleOption = (typeof ROLE_OPTIONS)[number];

export const PROJECT_OPTIONS = [
  { id: 'bieszczady-trails', name: 'Szlaki bieszczadzkie' },
  { id: 'wetlands-restoration', name: 'Renaturyzacja mokradeł' },
  { id: 'eco-education', name: 'Edukacja ekologiczna' },
  { id: 'wildlife-monitoring', name: 'Monitoring przyrodniczy' },
] as const;

export const STATUS_OPTIONS: Array<{ value: PersonStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Aktywne' },
  { value: 'PENDING', label: 'Oczekuje' },
  { value: 'INACTIVE', label: 'Nieaktywne' },
  { value: 'DELETED', label: 'Usunięte' },
];

export const SORT_OPTIONS = [
  { value: 'role-asc', label: 'Rola (A–Z)' },
  { value: 'role-desc', label: 'Rola (Z–A)' },
  { value: 'status-asc', label: 'Status (aktywne najpierw)' },
  { value: 'status-desc', label: 'Status (usunięte najpierw)' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export const DIRECTOR_ROLE_LABEL = 'Dyrektor';

export const PLACEHOLDER_ROLE: RoleOption = 'Wykonawca';

export const PLACEHOLDER_PROJECTS: ReadonlyArray<{ id: string; name: string }> =
  [PROJECT_OPTIONS[0]];

export const ROLE_FILTER_OPTIONS: ReadonlyArray<string> = [
  DIRECTOR_ROLE_LABEL,
  ...ROLE_OPTIONS,
];

export const ROLE_SELECT_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = ROLE_OPTIONS.map((role) => ({ value: role, label: role }));

export const ROLE_FILTER_SELECT_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = ROLE_FILTER_OPTIONS.map((role) => ({ value: role, label: role }));

export const PROJECT_SELECT_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = PROJECT_OPTIONS.map((project) => ({
  value: project.id,
  label: project.name,
}));
