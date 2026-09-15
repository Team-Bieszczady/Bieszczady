import type { BackendProjectCard } from '../../../lib/projectsApi';
import type { ProjectSortOption } from '../constants';
import { normalizeText } from '../../../lib/normalizeText';

type Project = BackendProjectCard;

export interface ProjectFilters {
  search: string;
  status: string;
  sort: ProjectSortOption | '';
}

export const EMPTY_PROJECT_FILTERS: ProjectFilters = {
  search: '',
  status: '',
  sort: '',
};

function byDeadline(a: Project, b: Project, direction: 1 | -1): number {
  if (a.daysLeft === null && b.daysLeft === null) return 0;
  if (a.daysLeft === null) return 1;
  if (b.daysLeft === null) return -1;
  return (a.daysLeft - b.daysLeft) * direction;
}

export function filterAndSortProjects(
  projects: Project[],
  filters: ProjectFilters,
): Project[] {
  const search = normalizeText(filters.search);

  const filtered = projects.filter((project) => {
    if (
      search &&
      !normalizeText(`${project.name} ${project.description}`).includes(search)
    ) {
      return false;
    }

    if (filters.status && project.status?.id !== filters.status) return false;
    return true;
  });

  if (!filters.sort) return filtered;

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case 'deadline-asc':
        return byDeadline(a, b, 1);
      case 'deadline-desc':
        return byDeadline(a, b, -1);
      case 'progress-desc':
        return b.progress - a.progress;
      case 'progress-asc':
        return a.progress - b.progress;
      default:
        return 0;
    }
  });
}
