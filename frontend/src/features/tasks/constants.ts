import {
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_LABELS,
} from '../projects/labels';
import type { TaskStatus } from '../projects/types';

export const TASK_STATUS_TABS: ReadonlyArray<{
  value: TaskStatus | null;
  label: string;
}> = [
  { value: null, label: 'Wszystkie' },
  { value: 'NEW', label: TASK_STATUS_LABELS.NEW },
  { value: 'IN_PROGRESS', label: TASK_STATUS_LABELS.IN_PROGRESS },
  { value: 'BLOCKED', label: TASK_STATUS_LABELS.BLOCKED },
  { value: 'DONE', label: TASK_STATUS_LABELS.DONE },
];

export const PRIORITY_SELECT_OPTIONS = TASK_PRIORITY_OPTIONS;

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
