import type { Person, PersonStatus } from '../data';
import type { SortOption } from '../constants';

export interface PeopleFilters {
  search: string;
  role: string;
  status: string;
  projectId: string;
  sort: SortOption | '';
}

export const EMPTY_FILTERS: PeopleFilters = {
  search: '',
  role: '',
  status: '',
  projectId: '',
  sort: '',
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

const STATUS_RANK: Record<PersonStatus, number> = {
  ACTIVE: 0,
  PENDING: 1,
  INACTIVE: 2,
  DELETED: 3,
};

export function filterAndSortPeople(
  people: Person[],
  filters: PeopleFilters,
): Person[] {
  const search = normalize(filters.search);

  const filtered = people.filter((person) => {
    if (
      search &&
      !normalize(`${person.firstName} ${person.lastName}`).includes(search)
    ) {
      return false;
    }
    if (filters.role && person.role !== filters.role) return false;
    if (filters.status && person.status !== filters.status) return false;
    if (
      filters.projectId &&
      !person.projects.some((project) => project.id === filters.projectId)
    ) {
      return false;
    }
    return true;
  });

  if (!filters.sort) return filtered;

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'role-asc':
        return a.role.localeCompare(b.role, 'pl');
      case 'role-desc':
        return b.role.localeCompare(a.role, 'pl');
      case 'status-asc':
        return STATUS_RANK[a.status] - STATUS_RANK[b.status];
      case 'status-desc':
        return STATUS_RANK[b.status] - STATUS_RANK[a.status];
      default:
        return 0;
    }
  });
}
