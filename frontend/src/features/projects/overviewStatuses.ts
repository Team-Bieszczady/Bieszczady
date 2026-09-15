export type StatusColorId =
  | 'green'
  | 'blue'
  | 'amber'
  | 'red'
  | 'violet'
  | 'gray';

export const STATUS_COLORS: ReadonlyArray<{
  id: StatusColorId;
  label: string;
  dot: string;
  pill: string;
}> = [
  {
    id: 'green',
    label: 'Zielony',
    dot: 'bg-darkGreen',
    pill: 'bg-lightGreen text-darkGreen',
  },
  {
    id: 'blue',
    label: 'Niebieski',
    dot: 'bg-blue-500',
    pill: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'amber',
    label: 'Bursztynowy',
    dot: 'bg-amber-500',
    pill: 'bg-amberSoft text-amberDark',
  },
  {
    id: 'red',
    label: 'Czerwony',
    dot: 'bg-red-500',
    pill: 'bg-redSoft text-darkRed',
  },
  {
    id: 'violet',
    label: 'Fioletowy',
    dot: 'bg-violet-500',
    pill: 'bg-violet-100 text-violet-700',
  },
  {
    id: 'gray',
    label: 'Szary',
    dot: 'bg-gray-400',
    pill: 'bg-gray-200 text-grayText',
  },
];

export function getStatusColor(color: string) {
  return STATUS_COLORS.find((entry) => entry.id === color) ?? STATUS_COLORS[0];
}
