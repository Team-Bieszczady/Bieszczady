export const PROJECT_SORT_OPTIONS = [
  { value: 'deadline-asc', label: 'Termin: najbliższy' },
  { value: 'deadline-desc', label: 'Termin: najdalszy' },
  { value: 'progress-desc', label: 'Postęp: najwyższy' },
  { value: 'progress-asc', label: 'Postęp: najniższy' },
] as const;

export type ProjectSortOption = (typeof PROJECT_SORT_OPTIONS)[number]['value'];

export const PROJECT_COLORS = [
  { id: 'green', className: 'bg-darkGreen' },
  { id: 'blue', className: 'bg-blue-500' },
  { id: 'fuchsia', className: 'bg-fuchsia-500' },
  { id: 'red', className: 'bg-red-500' },
  { id: 'orange', className: 'bg-orange-400' },
  { id: 'yellow', className: 'bg-yellow-400' },
] as const;
