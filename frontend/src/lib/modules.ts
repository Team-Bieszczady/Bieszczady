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

export type ModuleKey = (typeof MODULES)[number];

export const DEFAULT_USER_MODULES: ModuleKey[] = ['OVERVIEW', 'TASKS', 'CALENDAR'];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  PROJECTS: 'Projekty',
  PEOPLE: 'Ludzie',
  CALENDAR: 'Kalendarz',
  DECISIONS: 'Decyzje',
  SETTINGS: 'Ustawienia',
  OVERVIEW: 'Przegląd',
  TASKS: 'Zadania',
  BUDGET: 'Budżet',
  DOCUMENTS: 'Dokumenty',
};

export type ModuleFlags = Record<ModuleKey, boolean>;

export function toModuleFlags(granted: readonly ModuleKey[]): ModuleFlags {
  const grantedSet = new Set(granted);
  return Object.fromEntries(
    MODULES.map((module) => [module, grantedSet.has(module)]),
  ) as ModuleFlags;
}

export function fromModuleFlags(flags: ModuleFlags): ModuleKey[] {
  return MODULES.filter((module) => flags[module]);
}

export function hasModule(
  user: { isDirector: boolean; modules?: ModuleKey[] } | null,
  module: ModuleKey,
): boolean {
  return !!user && (user.isDirector || (user.modules ?? []).includes(module));
}
