import {
  TimelineStage,
  addDays,
  shiftDays,
  suggestFollowingStageShifts,
} from './shift-following-stages';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const stage = (
  id: string,
  deadline: string,
  overrides: Partial<TimelineStage> = {},
): TimelineStage => ({
  id,
  name: id,
  deadline: day(deadline),
  completedAt: null,
  archivedAt: null,
  ...overrides,
});

describe('suggestFollowingStageShifts', () => {
  const timeline = [
    stage('a', '2026-01-31'),
    stage('b', '2026-02-28'),
    stage('c', '2026-03-31'),
  ];

  it('suggests shifting the later stages that a move has overtaken', () => {
    const moved = [stage('a', '2026-04-30'), timeline[1], timeline[2]];

    const suggestions = suggestFollowingStageShifts(moved, 'a', 89);

    expect(suggestions.map((s) => s.stageId)).toEqual(['b', 'c']);
    expect(suggestions[0].currentDeadline).toEqual(day('2026-02-28'));
    expect(suggestions[0].suggestedDeadline).toEqual(
      addDays(day('2026-02-28'), 89),
    );
  });

  it('leaves stages alone when the move does not overtake them', () => {
    const moved = [stage('a', '2026-02-10'), timeline[1], timeline[2]];

    expect(suggestFollowingStageShifts(moved, 'a', 10)).toEqual([]);
  });

  it('suggests nothing when a deadline is pulled earlier', () => {
    const moved = [stage('a', '2025-12-01'), timeline[1], timeline[2]];

    expect(suggestFollowingStageShifts(moved, 'a', -61)).toEqual([]);
  });

  it('never suggests moving a finished or archived stage', () => {
    const moved = [
      stage('a', '2026-04-30'),
      stage('b', '2026-02-28', { completedAt: day('2026-02-20') }),
      stage('c', '2026-03-31', { archivedAt: day('2026-03-01') }),
    ];

    expect(suggestFollowingStageShifts(moved, 'a', 89)).toEqual([]);
  });

  it('only looks at stages after the moved one', () => {
    const moved = [timeline[0], timeline[1], stage('c', '2026-06-30')];

    expect(suggestFollowingStageShifts(moved, 'c', 91)).toEqual([]);
  });

  it('returns nothing for an unknown stage', () => {
    expect(suggestFollowingStageShifts(timeline, 'missing', 30)).toEqual([]);
  });

  it('reads position from the list order, not from the deadlines', () => {
    const moved = [stage('a', '2026-12-31'), timeline[1], timeline[2]];

    expect(
      suggestFollowingStageShifts(moved, 'a', 334).map((s) => s.stageId),
    ).toEqual(['b', 'c']);
  });
});

describe('shiftDays', () => {
  it('counts whole days between two dates', () => {
    expect(shiftDays(day('2026-07-15'), day('2026-10-31'))).toBe(108);
    expect(shiftDays(day('2026-10-31'), day('2026-07-15'))).toBe(-108);
    expect(shiftDays(day('2026-01-01'), day('2026-01-01'))).toBe(0);
  });
});
