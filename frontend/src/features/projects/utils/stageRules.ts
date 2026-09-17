import type { Stage } from '../types';
import { toIsoDate } from './isoDate';

export type StageIssue =
  | 'notFound'
  | 'emptyName'
  | 'duplicateName'
  | 'deadlineRequired'
  | 'deadlineBeforeStart'
  | 'startBeforeProject'
  | 'deadlineAfterProjectEnd'
  | 'startDateEarlier'
  | 'startDateAfterCompletion'
  | 'deadlineBeforeCompletion'
  | 'stageCompleted'
  | 'stageArchived'
  | 'hasContent'
  | 'invalidTarget'
  | 'completedNeedsArchive';

export type RuleResult = { ok: true } | { ok: false; issue: StageIssue };

const OK: RuleResult = { ok: true };

function fail(issue: StageIssue): RuleResult {
  return { ok: false, issue };
}

export const STAGE_ISSUE_MESSAGES: Record<StageIssue, string> = {
  notFound: 'Nie znaleziono etapu.',
  emptyName: 'Nazwa etapu nie może być pusta',
  duplicateName: 'Etap o tej nazwie już istnieje w tym projekcie',
  deadlineRequired: 'Termin etapu jest wymagany',
  deadlineBeforeStart: 'Termin nie może być wcześniejszy niż data rozpoczęcia',
  startBeforeProject: 'Etap nie może zaczynać się przed datą startu projektu',
  deadlineAfterProjectEnd:
    'Termin etapu nie może być późniejszy niż data zakończenia projektu',
  startDateEarlier: 'W zakończonym etapie nie można cofnąć daty rozpoczęcia',
  startDateAfterCompletion:
    'Data rozpoczęcia nie może być późniejsza niż data zakończenia etapu',
  deadlineBeforeCompletion:
    'Termin nie może być wcześniejszy niż data zakończenia etapu',
  stageCompleted: 'Etap jest zakończony — najpierw go wznów.',
  stageArchived: 'Etap jest zarchiwizowany — najpierw go przywróć.',
  hasContent: 'Ten etap ma zawartość — wybierz, co ma się z nią stać.',
  invalidTarget: 'Wybierz etap docelowy',
  completedNeedsArchive:
    'Zakończonego etapu nie można usunąć — najpierw go zarchiwizuj.',
};

export interface StageDateValues {
  startDate: string | null;
  deadline: string;
}

/** The project's window. Both ends are nullable, and each bound only applies
 *  when the project actually carries it. */
export interface ProjectDateBounds {
  startDate: string | null;
  plannedEndDate: string | null;
}

export function validateStageDates(
  stage: Stage | null,
  next: StageDateValues,
  project?: ProjectDateBounds,
): RuleResult {
  if (!next.deadline) return fail('deadlineRequired');
  if (next.startDate && next.startDate > next.deadline) {
    return fail('deadlineBeforeStart');
  }

  if (project) {
    const from = next.startDate ?? next.deadline;
    if (project.startDate && from < project.startDate) {
      return fail('startBeforeProject');
    }
    if (project.plannedEndDate && next.deadline > project.plannedEndDate) {
      return fail('deadlineAfterProjectEnd');
    }
  }

  if (stage?.completedAt) {
    const completedOn = toIsoDate(stage.completedAt);

    if (next.deadline < completedOn) return fail('deadlineBeforeCompletion');
    if (next.startDate && next.startDate > completedOn) {
      return fail('startDateAfterCompletion');
    }
    if (next.startDate && stage.startDate && next.startDate < stage.startDate) {
      return fail('startDateEarlier');
    }
  }

  return OK;
}


export function validateContentAddition(stage: Stage): RuleResult {
  if (stage.archivedAt) return fail('stageArchived');
  if (stage.completedAt) return fail('stageCompleted');
  return OK;
}

export function validateMoveTarget(
  source: Stage,
  target: Stage | undefined,
): RuleResult {
  if (!target || target.id === source.id) return fail('invalidTarget');
  return validateContentAddition(target);
}

export function getMoveTargets(
  stages: Stage[],
  sourceStageId: string,
): Stage[] {
  return stages.filter(
    (stage) =>
      stage.id !== sourceStageId &&
      stage.archivedAt === null &&
      stage.completedAt === null,
  );
}

export interface StageShiftSuggestion {
  stageId: string;
  name: string;
  currentDeadline: string;
  suggestedDeadline: string;
}

