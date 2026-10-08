export const MEETING_COLORS = [
  { id: 'green', className: 'border-darkGreen bg-lightGreen' },
  { id: 'blue', className: 'border-blue-500 bg-blue-100' },
  { id: 'fuchsia', className: 'border-fuchsia-500 bg-fuchsia-100' },
  { id: 'red', className: 'border-red-500 bg-red-100' },
  { id: 'orange', className: 'border-orange-400 bg-orange-100' },
  { id: 'yellow', className: 'border-yellow-400 bg-yellow-100' },
] as const;

export function meetingColorClass(projectColor: string | undefined) {
  return (
    MEETING_COLORS.find((color) => color.id === projectColor)?.className ??
    'border-gray-400 bg-gray-100'
  );
}
