const MS_PER_DAY = 86_400_000;

export interface TimelineStage {
  id: string;
  name: string;
  deadline: Date;
  completedAt: Date | null;
  archivedAt: Date | null;
}

export interface StageShiftSuggestion {
  stageId: string;
  name: string;
  currentDeadline: Date;
  suggestedDeadline: Date;
}

export function shiftDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

export function suggestFollowingStageShifts(
  candidates: ReadonlyArray<TimelineStage>,
  movedStageId: string,
  days: number,
): StageShiftSuggestion[] {
  if (days <= 0) return [];

  const movedIndex = candidates.findIndex((s) => s.id === movedStageId);
  if (movedIndex === -1) return [];

  const moved = candidates[movedIndex];

  return candidates
    .slice(movedIndex + 1)
    .filter(
      (stage) =>
        stage.archivedAt === null &&
        stage.completedAt === null &&
        stage.deadline.getTime() < moved.deadline.getTime(),
    )
    .map((stage) => ({
      stageId: stage.id,
      name: stage.name,
      currentDeadline: stage.deadline,
      suggestedDeadline: addDays(stage.deadline, days),
    }));
}
