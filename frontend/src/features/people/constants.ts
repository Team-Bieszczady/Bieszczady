import { PROJECT_ROLE_LABELS } from '../projects/labels';
import type { PersonStatus } from './data';

export const PROJECT_OPTIONS = [
  { id: 'bieszczady-trails', name: 'Szlaki bieszczadzkie' },
  { id: 'wetlands-restoration', name: 'Renaturyzacja mokradeł' },
  { id: 'eco-education', name: 'Edukacja ekologiczna' },
  { id: 'wildlife-monitoring', name: 'Monitoring przyrodniczy' },
] as const;

export const PERSON_STATUS_LABELS: Record<PersonStatus, string> = {
  ACTIVE: 'Aktywne',
  PENDING: 'Oczekuje',
  INACTIVE: 'Nieaktywne',
  DELETED: 'Usunięte',
};

export const STATUS_OPTIONS = (
  Object.keys(PERSON_STATUS_LABELS) as PersonStatus[]
).map((status) => ({ value: status, label: PERSON_STATUS_LABELS[status] }));

export const SORT_OPTIONS = [
  { value: 'role-asc', label: 'Rola (A–Z)' },
  { value: 'role-desc', label: 'Rola (Z–A)' },
  { value: 'status-asc', label: 'Status (aktywne najpierw)' },
  { value: 'status-desc', label: 'Status (usunięte najpierw)' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export const DIRECTOR_ROLE_LABEL = 'Dyrektor';

export const PLACEHOLDER_ROLE = PROJECT_ROLE_LABELS.EXECUTOR;

export const PLACEHOLDER_PROJECTS: ReadonlyArray<{ id: string; name: string }> =
  [PROJECT_OPTIONS[0]];

export const ROLE_FILTER_OPTIONS: ReadonlyArray<string> = [
  DIRECTOR_ROLE_LABEL,
  ...Object.values(PROJECT_ROLE_LABELS),
];

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
