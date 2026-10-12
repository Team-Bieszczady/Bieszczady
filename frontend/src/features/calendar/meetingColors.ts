export const MEETING_COLORS = [
  {
    id: 'green',
    accent: 'bg-darkGreen',
    tint: 'bg-darkGreen/12',
    border: 'border-darkGreen',
  },
  {
    id: 'blue',
    accent: 'bg-blue-500',
    tint: 'bg-blue-500/15',
    border: 'border-blue-500',
  },
  {
    id: 'fuchsia',
    accent: 'bg-fuchsia-500',
    tint: 'bg-fuchsia-500/12',
    border: 'border-fuchsia-500',
  },
  {
    id: 'red',
    accent: 'bg-red-500',
    tint: 'bg-red-500/12',
    border: 'border-red-500',
  },
  {
    id: 'orange',
    accent: 'bg-orange-400',
    tint: 'bg-orange-400/18',
    border: 'border-orange-400',
  },
  {
    id: 'yellow',
    accent: 'bg-yellow-400',
    tint: 'bg-yellow-400/25',
    border: 'border-yellow-400',
  },
] as const;

const FALLBACK_COLORS = {
  accent: 'bg-gray-400',
  tint: 'bg-gray-400/15',
  border: 'border-gray-400',
};

export function meetingColors(projectColor: string | undefined) {
  return (
    MEETING_COLORS.find((color) => color.id === projectColor) ?? FALLBACK_COLORS
  );
}
