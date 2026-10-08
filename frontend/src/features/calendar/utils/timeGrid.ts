import type { Meeting } from '../types';

export const HOUR_HEIGHT = 60;

const DEFAULT_FIRST_HOUR = 8;
const DEFAULT_LAST_HOUR = 18;
const SHORT_MEETING_MINUTES = 45;
const LONG_MEETING_MINUTES = 75;
const GAP_BETWEEN_MEETINGS = 4;
const STACK_INDENT = 10;
const MAX_INDENT_LEVELS = 2;
const STACK_MIN_GAP_MINUTES = 30;

export type MeetingSize = 'short' | 'medium' | 'long';

export interface PlacedMeeting {
  meeting: Meeting;
  column: number;
  span: number;
  columns: number;
  depth: number;
  visibleMinutes: number;
}

export interface NowMarker {
  top: number;
  label: string;
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTop(minutes: number, firstHour: number) {
  return ((minutes - firstHour * 60) / 60) * HOUR_HEIGHT;
}

export function gridHeight(firstHour: number, lastHour: number) {
  return (lastHour - firstHour) * HOUR_HEIGHT;
}

export function hoursBetween(firstHour: number, lastHour: number) {
  return Array.from(
    { length: lastHour - firstHour },
    (_, index) => firstHour + index,
  );
}

export function visibleHours(meetings: Meeting[]) {
  let first = DEFAULT_FIRST_HOUR;
  let last = DEFAULT_LAST_HOUR;

  for (const meeting of meetings) {
    first = Math.min(first, Math.floor(toMinutes(meeting.startTime) / 60));
    last = Math.max(last, Math.ceil(toMinutes(meeting.endTime) / 60));
  }

  return { first, last };
}

function durationOf(meeting: Meeting) {
  return toMinutes(meeting.endTime) - toMinutes(meeting.startTime);
}

export function meetingSize(visibleMinutes: number): MeetingSize {
  if (visibleMinutes < SHORT_MEETING_MINUTES) return 'short';
  if (visibleMinutes < LONG_MEETING_MINUTES) return 'medium';
  return 'long';
}

export function horizontalPlacement(
  { column, span, columns, depth }: PlacedMeeting,
  edgeGap: number,
) {
  const indent = Math.min(depth, MAX_INDENT_LEVELS) * STACK_INDENT;
  const lastColumn = column + span - 1;
  const leftGap = column === 0 ? edgeGap : GAP_BETWEEN_MEETINGS / 2;
  const rightGap =
    lastColumn === columns - 1 ? edgeGap : GAP_BETWEEN_MEETINGS / 2;

  return {
    left: `calc(${indent}px + (100% - ${indent}px) * ${column / columns} + ${leftGap}px)`,
    width: `calc((100% - ${indent}px) * ${span / columns} - ${leftGap + rightGap}px)`,
  };
}

function overlaps(a: Meeting, b: Meeting) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

function startsTogether(earlier: Meeting, later: Meeting) {
  return (
    toMinutes(later.startTime) - toMinutes(earlier.startTime) <
    STACK_MIN_GAP_MINUTES
  );
}

function sortByStart(meetings: Meeting[]) {
  return [...meetings].sort(
    (a, b) =>
      a.startTime.localeCompare(b.startTime) ||
      b.endTime.localeCompare(a.endTime),
  );
}

export function nowMarker(
  now: Date,
  firstHour: number,
  lastHour: number,
): NowMarker | null {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < firstHour * 60 || minutes > lastHour * 60) return null;

  return {
    top: minutesToTop(minutes, firstHour),
    label: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
}

export function placeSideBySide(meetings: Meeting[]): PlacedMeeting[] {
  const sorted = sortByStart(meetings);

  const placed: PlacedMeeting[] = [];
  let group: { meeting: Meeting; column: number }[] = [];
  let columnEnds: string[] = [];
  let groupEnd = '';

  const isFree = (column: number, meeting: Meeting) =>
    !group.some(
      (other) => other.column === column && overlaps(other.meeting, meeting),
    );

  const closeGroup = () => {
    for (const item of group) {
      let span = 1;
      while (
        item.column + span < columnEnds.length &&
        isFree(item.column + span, item.meeting)
      ) {
        span += 1;
      }
      placed.push({
        ...item,
        span,
        columns: columnEnds.length,
        depth: 0,
        visibleMinutes: durationOf(item.meeting),
      });
    }
    group = [];
    columnEnds = [];
    groupEnd = '';
  };

  for (const meeting of sorted) {
    if (group.length > 0 && meeting.startTime >= groupEnd) closeGroup();

    let column = columnEnds.findIndex((end) => end <= meeting.startTime);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(meeting.endTime);
    } else {
      columnEnds[column] = meeting.endTime;
    }

    group.push({ meeting, column });
    if (meeting.endTime > groupEnd) groupEnd = meeting.endTime;
  }
  closeGroup();

  return placed;
}

interface Stack {
  depth: number;
  members: Meeting[];
}

export function placeStacked(meetings: Meeting[]): PlacedMeeting[] {
  const placed: { meeting: Meeting; stack: Stack }[] = [];

  for (const meeting of sortByStart(meetings)) {
    const below = placed.filter((item) => overlaps(item.meeting, meeting));
    const neighbour = below.find((item) =>
      startsTogether(item.meeting, meeting),
    );

    if (neighbour) {
      neighbour.stack.members.push(meeting);
      placed.push({ meeting, stack: neighbour.stack });
      continue;
    }

    const depth = Math.max(-1, ...below.map((item) => item.stack.depth)) + 1;
    placed.push({ meeting, stack: { depth, members: [meeting] } });
  }

  return placed.map(({ meeting, stack }, index) => {
    const coveredAfter = placed
      .slice(index + 1)
      .filter(
        (item) =>
          item.stack.depth > stack.depth && overlaps(item.meeting, meeting),
      )
      .map(
        (item) =>
          toMinutes(item.meeting.startTime) - toMinutes(meeting.startTime),
      );

    return {
      meeting,
      column: stack.members.indexOf(meeting),
      span: 1,
      columns: stack.members.length,
      depth: stack.depth,
      visibleMinutes: Math.min(durationOf(meeting), ...coveredAfter),
    };
  });
}
