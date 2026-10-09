import { TASK_STATUS_LABELS } from '../../projects/labels';
import { meetingColors } from '../meetingColors';
import type { CalendarProject, Deadline } from '../types';

export type DeadlineChipSize = 'month' | 'week' | 'day';

const SIZE_CLASSES: Record<DeadlineChipSize, { chip: string; bar: string }> = {
  month: {
    chip: 'h-5 rounded-r pr-1.5 pl-2.5 text-[11px] leading-4.5',
    bar: 'w-0.75',
  },
  week: {
    chip: 'h-6 rounded-r-md pr-2 pl-3 text-xs leading-5.5 font-semibold',
    bar: 'w-1',
  },
  day: {
    chip: 'h-7 rounded-r-md pr-2 pl-3 text-sm leading-6.5 font-semibold',
    bar: 'w-1',
  },
};

interface DeadlineChipProps {
  deadline: Deadline;
  project: CalendarProject | undefined;
  size: DeadlineChipSize;
  withPrefix?: boolean;
  onClick: () => void;
}

function deadlineLabel(deadline: Deadline, withPrefix: boolean) {
  const done = deadline.status === 'DONE' ? '✓ ' : '';
  const prefix = withPrefix ? 'Termin: ' : '';
  return `${done}${prefix}${deadline.title}`;
}

function describeDeadline(deadline: Deadline) {
  return `${deadlineLabel(deadline, true)}, ${TASK_STATUS_LABELS[deadline.status].toLowerCase()}`;
}

export function DeadlineChip({
  deadline,
  project,
  size,
  withPrefix = true,
  onClick,
}: DeadlineChipProps) {
  const colors = meetingColors(project?.color);
  const { chip, bar } = SIZE_CLASSES[size];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={describeDeadline(deadline)}
      title={describeDeadline(deadline)}
      className={`relative block w-full shrink-0 cursor-pointer truncate border border-l-0 border-dashed text-left text-dark hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-darkGreen ${colors.border} ${colors.tint} ${chip}`}
    >
      <span
        aria-hidden="true"
        className={`absolute -inset-y-px left-0 rounded-full ${bar} ${colors.accent}`}
      />
      {deadlineLabel(deadline, withPrefix)}
      {size === 'day' && project && (
        <span className="ml-2 font-normal text-gray-400">{project.name}</span>
      )}
    </button>
  );
}
