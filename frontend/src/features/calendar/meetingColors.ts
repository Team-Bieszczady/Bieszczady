export const MEETING_COLORS = [
  { id: 'green', accent: 'bg-darkGreen', tint: 'bg-darkGreen/12' },
  { id: 'blue', accent: 'bg-blue-500', tint: 'bg-blue-500/15' },
  { id: 'fuchsia', accent: 'bg-fuchsia-500', tint: 'bg-fuchsia-500/12' },
  { id: 'red', accent: 'bg-red-500', tint: 'bg-red-500/12' },
  { id: 'orange', accent: 'bg-orange-400', tint: 'bg-orange-400/18' },
  { id: 'yellow', accent: 'bg-yellow-400', tint: 'bg-yellow-400/25' },
] as const;

const FALLBACK_COLORS = { accent: 'bg-gray-400', tint: 'bg-gray-400/15' };

export function meetingColors(projectColor: string | undefined) {
  return (
    MEETING_COLORS.find((color) => color.id === projectColor) ?? FALLBACK_COLORS
  );
}
