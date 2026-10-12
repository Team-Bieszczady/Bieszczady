import { TASK_STATUS_OPTIONS } from '../projects/labels';
import type { TaskStatusValue } from '../../lib/projectsApi';

export const TASK_STATUS_TABS: ReadonlyArray<{
  value: TaskStatusValue | null;
  label: string;
}> = [{ value: null, label: 'Wszystkie' }, ...TASK_STATUS_OPTIONS];

export const NO_OPEN_ACTIONS_MESSAGE =
  'Brak działań w otwartych etapach, najpierw dodaj działanie w Harmonogramie.';

export type DeadlineFilter = 'overdue' | 'today' | 'week' | 'month';

export const DEADLINE_FILTER_OPTIONS: ReadonlyArray<{
  value: DeadlineFilter;
  label: string;
}> = [
  { value: 'overdue', label: 'Po terminie' },
  { value: 'today', label: 'Dziś' },
  { value: 'week', label: 'Ten tydzień' },
  { value: 'month', label: 'Ten miesiąc' },
];

export const TASK_SORT_OPTIONS = [
  { value: 'deadline-asc', label: 'Termin: najbliższy' },
  { value: 'deadline-desc', label: 'Termin: najdalszy' },
  { value: 'priority-desc', label: 'Priorytet: najwyższy' },
  { value: 'title-asc', label: 'Nazwa (A–Z)' },
] as const;

export type TaskSortOption = (typeof TASK_SORT_OPTIONS)[number]['value'];

export const PAGE_SIZE = 6;
