import type { StageStatus } from '../../../types';

interface StageStateBadgeProps {
  status: StageStatus;
  isArchived?: boolean;
}

const TONE: Record<StageStatus, string> = {
  planned: 'bg-gray-200 text-grayText',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-lightGreen text-darkGreen',
};

const LABEL: Record<StageStatus, string> = {
  planned: 'Planowany',
  in_progress: 'W trakcie',
  completed: 'Zakończony',
};

export default function StageStateBadge({
  status,
  isArchived = false,
}: StageStateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-[0.3px] whitespace-nowrap ${
        isArchived ? 'bg-gray-200 text-grayText' : TONE[status]
      }`}
    >
      {isArchived ? 'Zarchiwizowany' : LABEL[status]}
    </span>
  );
}
