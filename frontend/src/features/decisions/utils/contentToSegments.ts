export interface DecisionSegment {
  text: string;
  strong?: boolean;
}

const PL_MONTHS =
  'stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia';

/** Quoted names and dates get bold, so a typed decision reads like a recorded
 * one. The wire carries a flat string, so this is the only source of emphasis. */
const EMPHASIS_PATTERN = new RegExp(
  [
    '[„"][^„”"]+[”"]',
    `\\d{1,2}\\s+(?:${PL_MONTHS})(?:\\s+\\d{4})?`,
    '\\d{1,2}\\.\\d{1,2}\\.\\d{2,4}',
    '\\d{4}-\\d{2}-\\d{2}',
  ].join('|'),
  'gu',
);

export function contentToSegments(content: string): DecisionSegment[] {
  const segments: DecisionSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(EMPHASIS_PATTERN)) {
    const start = match.index;
    if (start > lastIndex) {
      segments.push({ text: content.slice(lastIndex, start) });
    }
    segments.push({ text: match[0], strong: true });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ text: content.slice(lastIndex) });
  }

  return segments;
}
