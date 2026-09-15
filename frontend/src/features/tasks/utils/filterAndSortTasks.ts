import { normalizeText } from '../../../lib/normalizeText';
import type { TaskPriority, TaskStatus } from '../../projects/types';
import { isInPeriod } from '../../projects/utils/schedulePeriod';
import type { TaskRow } from '../data';
import type { DeadlineFilter, TaskSortOption } from '../constants';

export interface TaskFilters {
  search: string;
  owner: string;
  priority: string;
  deadline: string;
  sort: TaskSortOption | '';
}

export const EMPTY_TASK_FILTERS: TaskFilters = {
  search: '',
  owner: '',
  priority: '',
  deadline: '',
  sort: '',
};


const PRIORITY_RANK: Record<TaskPriority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function matchesDeadline(
  row: TaskRow,
  filter: DeadlineFilter,
  today: string,
): boolean {
  const due = row.effectiveDueDate;
  if (!due) return false;

  if (filter === 'overdue') return row.status !== 'DONE' && due < today;
  if (filter === 'today') return due === today;
  return isInPeriod(due, filter === 'week' ? 'week' : 'month', today);
}

export function filterAndSortTasks(
  rows: TaskRow[],
  filters: TaskFilters,
  today: string,
): TaskRow[] {
  const search = normalizeText(filters.search);

  const filtered = rows.filter((row) => {
    if (search && !normalizeText(row.title).includes(search)) return false;
    if (filters.owner && row.ownerId !== filters.owner) return false;
    if (filters.priority && row.priority !== filters.priority) return false;
    if (
      filters.deadline &&
      !matchesDeadline(row, filters.deadline as DeadlineFilter, today)
    ) {
      return false;
    }
    return true;
  });

  if (!filters.sort) return filtered;

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'deadline-asc':
        return (a.effectiveDueDate ?? '9999').localeCompare(
          b.effectiveDueDate ?? '9999',
        );
      case 'deadline-desc':
        return (b.effectiveDueDate ?? '0000').localeCompare(
          a.effectiveDueDate ?? '0000',
        );
      case 'priority-desc':
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
      case 'title-asc':
        return a.title.localeCompare(b.title, 'pl');
      default:
        return 0;
    }
  });
}

export function countByStatus(rows: TaskRow[]): Record<TaskStatus, number> {
  return rows.reduce(
    (counts, row) => {
      counts[row.status] += 1;
      return counts;
    },
    { NEW: 0, IN_PROGRESS: 0, BLOCKED: 0, DONE: 0 } as Record<
      TaskStatus,
      number
    >,
  );
}
