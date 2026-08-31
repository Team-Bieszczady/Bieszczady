export const MODULES = [
  'PROJECTS',
  'PEOPLE',
  'CALENDAR',
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

export const DEFAULT_USER_MODULES: Module[] = ['OVERVIEW', 'TASKS', 'CALENDAR'];
