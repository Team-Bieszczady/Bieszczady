import { normalizeText } from '../../../lib/normalizeText';
import type { ScheduleAction } from '../types';
import type { Stage } from '../types';
import { STAGE_ISSUE_MESSAGES } from './stageRules';

export type ScheduleIssue =
  | 'actionNotFound'
  | 'taskNotFound'
  | 'emptyActionTitle'
  | 'duplicateActionTitle'
  | 'emptyTaskTitle'
  | 'subtaskNotFound'
  | 'emptySubtaskTitle'
  | 'stageRequired'
  | 'noOpenStages'
  | 'stageCompleted'
  | 'stageArchived';

export type ScheduleRuleResult =
  | { ok: true; autoClosed?: boolean; reopened?: boolean }
  | { ok: false; issue: ScheduleIssue };

const OK: ScheduleRuleResult = { ok: true };

function fail(issue: ScheduleIssue): ScheduleRuleResult {
  return { ok: false, issue };
}

export const SCHEDULE_ISSUE_MESSAGES: Record<ScheduleIssue, string> = {
  actionNotFound: 'Nie znaleziono działania.',
  taskNotFound: 'Nie znaleziono zadania.',
  emptyActionTitle: 'Nazwa działania nie może być pusta',
  duplicateActionTitle: 'Działanie o tej nazwie już istnieje w tym etapie',
  emptyTaskTitle: 'Nazwa zadania nie może być pusta',
  subtaskNotFound: 'Nie znaleziono podzadania.',
  emptySubtaskTitle: 'Nazwa podzadania nie może być pusta',
  stageRequired: 'Wybierz etap, do którego należy działanie',
  noOpenStages:
    'Najpierw dodaj etap w sekcji „Etapy”, działanie musi do niego należeć.',
  stageCompleted: STAGE_ISSUE_MESSAGES.stageCompleted,
  stageArchived: STAGE_ISSUE_MESSAGES.stageArchived,
};

export function validateStageAcceptsWork(
  stage: Stage | undefined,
): ScheduleRuleResult {
  if (!stage) return fail('stageRequired');
  if (stage.archivedAt) return fail('stageArchived');
  if (stage.completedAt) return fail('stageCompleted');
  return OK;
}

export function validateActionTitle(
  title: string,
  stageId: string,
  actions: ScheduleAction[],
  exceptId?: string,
): ScheduleRuleResult {
  const trimmed = title.trim();
  if (!trimmed) return fail('emptyActionTitle');

  const taken = actions.some(
    (action) =>
      action.id !== exceptId &&
      action.stageId === stageId &&
      normalizeText(action.title) === normalizeText(trimmed),
  );

  return taken ? fail('duplicateActionTitle') : OK;
}

export function getActionStageTargets(stages: Stage[]): Stage[] {
  return stages.filter(
    (stage) => stage.archivedAt === null && stage.completedAt === null,
  );
}
