import type { Meeting } from '../types';

export const HOUR_HEIGHT = 60;

const DEFAULT_FIRST_HOUR = 8;
const DEFAULT_LAST_HOUR = 18;
const SHORT_MEETING_MINUTES = 45;
const LONG_MEETING_MINUTES = 75;
const GAP_BETWEEN_MEETINGS = 4;

export type MeetingSize = 'short' | 'medium' | 'long';

export interface PlacedMeeting {
  meeting: Meeting;
  column: number;
  columns: number;
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

export function meetingSize(meeting: Meeting): MeetingSize {
  const minutes = toMinutes(meeting.endTime) - toMinutes(meeting.startTime);

  if (minutes < SHORT_MEETING_MINUTES) return 'short';
  if (minutes < LONG_MEETING_MINUTES) return 'medium';
  return 'long';
}

export function horizontalPlacement(
  { column, columns }: PlacedMeeting,
  edgeGap: number,
) {
  const share = 100 / columns;
  const leftGap = column === 0 ? edgeGap : GAP_BETWEEN_MEETINGS / 2;
  const rightGap = column === columns - 1 ? edgeGap : GAP_BETWEEN_MEETINGS / 2;

  return {
    left: `calc(${column * share}% + ${leftGap}px)`,
    width: `calc(${share}% - ${leftGap + rightGap}px)`,
  };
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
  const sorted = [...meetings].sort(
    (a, b) =>
      a.startTime.localeCompare(b.startTime) ||
      b.endTime.localeCompare(a.endTime),
  );

  const placed: PlacedMeeting[] = [];
  let group: { meeting: Meeting; column: number }[] = [];
  let columnEnds: string[] = [];
  let groupEnd = '';

  const closeGroup = () => {
    for (const item of group) {
      placed.push({ ...item, columns: columnEnds.length });
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
