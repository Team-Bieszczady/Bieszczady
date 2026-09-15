import type { Stage, StageStatus } from '../types';
import { toIsoDate, todayIso } from './isoDate';
import { EMPTY_COUNTS, type TaskCounts } from './scheduleState';

export function getStageStatus(
  stage: Stage,
  counts: TaskCounts,
  today: string,
): StageStatus {
  if (stage.completedAt) return 'completed';

  if (counts.done > 0 || counts.started > 0) return 'in_progress';
  if (stage.startDate && stage.startDate <= today) return 'in_progress';

  return 'planned';
}

export function isStageOverdue(
  stage: Stage,
  counts: TaskCounts,
  today: string,
): boolean {
  if (stage.completedAt || stage.archivedAt) return false;
  if (stage.deadline >= today) return false;

  return counts.total === 0 || counts.pending > 0;
}

export function getStageProgress(stage: Stage, counts: TaskCounts): number {
  if (stage.completedAt) return 100;

  return counts.total === 0
    ? 0
    : Math.round((counts.done / counts.total) * 100);
}

export type CompletionTone = 'onTime' | 'late';

export function getCompletionTone(stage: Stage): CompletionTone | null {
  if (!stage.completedAt) return null;
  return toIsoDate(stage.completedAt) <= stage.deadline ? 'onTime' : 'late';
}

export function isStageMoved(stage: Stage): boolean {
  return (
    stage.originalDeadline !== null && stage.originalDeadline !== stage.deadline
  );
}

export function getPlannedDeadline(stage: Stage): string {
  return stage.originalDeadline ?? stage.deadline;
}

export function isStageArchived(stage: Stage): boolean {
  return stage.archivedAt !== null;
}

export function activeStages(stages: Stage[]): Stage[] {
  return stages.filter((stage) => stage.archivedAt === null);
}

export function archivedStages(stages: Stage[]): Stage[] {
  return stages.filter((stage) => stage.archivedAt !== null);
}

export interface StageView {
  status: StageStatus;
  isOverdue: boolean;
  isArchived: boolean;
  counts: TaskCounts;
  percent: number;
  plannedDeadline: string;
  movedDeadline: string | null;
  movedNote: string | null;
  completedAt: string | null;
  completionTone: CompletionTone | null;
  isEmpty: boolean;
  canAddContent: boolean;
}

export function describeStage(
  stage: Stage,
  counts: TaskCounts = EMPTY_COUNTS,
  today: string = todayIso(),
): StageView {
  return {
    status: getStageStatus(stage, counts, today),
    isOverdue: isStageOverdue(stage, counts, today),
    isArchived: isStageArchived(stage),
    counts,
    percent: getStageProgress(stage, counts),
    plannedDeadline: getPlannedDeadline(stage),
    movedDeadline: isStageMoved(stage) ? stage.deadline : null,
    movedNote: isStageMoved(stage) ? stage.deadlineNote : null,
    completedAt: stage.completedAt,
    completionTone: getCompletionTone(stage),
    isEmpty: counts.actions === 0,
    canAddContent: !stage.completedAt && !stage.archivedAt,
  };
}
