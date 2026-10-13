export const MODULES = [
  'PROJECTS',
  'PEOPLE',
  'PARTICIPANTS',
  'CALENDAR',
  'KSEF',
  'DECISIONS',
  'SETTINGS',
  'OVERVIEW',
  'TASKS',
  'BUDGET',
  'DOCUMENTS',
] as const;

export type Module = (typeof MODULES)[number];

export function isModule(value: string): value is Module {
  return (MODULES as readonly string[]).includes(value);
}

export const DEFAULT_USER_MODULES: Module[] = [
  'PROJECTS',
  'OVERVIEW',
  'TASKS',
  'CALENDAR',
];

export const PROJECT_SCOPED_MODULES = ['TASKS', 'BUDGET', 'DOCUMENTS'] as const;

export type ProjectScopedModule = (typeof PROJECT_SCOPED_MODULES)[number];

export function isProjectScopedModule(
  value: string,
): value is ProjectScopedModule {
  return (PROJECT_SCOPED_MODULES as readonly string[]).includes(value);
}
