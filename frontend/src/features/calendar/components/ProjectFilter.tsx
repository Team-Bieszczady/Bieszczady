import { PROJECT_COLORS } from '../../projects/constants';
import type { CalendarProject } from '../types';

const CHIP_CLASSES =
  'inline-flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium';

interface LayerChipProps {
  label: string;
  shown: boolean;
  shownDot: string;
  hiddenDot: string;
  onToggle: () => void;
}

function LayerChip({
  label,
  shown,
  shownDot,
  hiddenDot,
  onToggle,
}: LayerChipProps) {
  return (
    <button
      type="button"
      aria-pressed={shown}
      onClick={onToggle}
      className={`${CHIP_CLASSES} ${shown ? 'text-dark' : 'text-gray-400'}`}
    >
      <span
        className={`h-2.5 w-2.5 shrink-0 rounded-full ${shown ? shownDot : hiddenDot}`}
      ></span>
      <span>{label}</span>
    </button>
  );
}

type Props = {
  projects: CalendarProject[];
  hiddenProjectIds: string[];
  onToggle: (id: string) => void;
  meetingsShown: boolean;
  onToggleMeetings: () => void;
  showDeadlineToggle: boolean;
  deadlinesShown: boolean;
  onToggleDeadlines: () => void;
};

export function ProjectFilter({
  projects,
  hiddenProjectIds,
  onToggle,
  meetingsShown,
  onToggleMeetings,
  showDeadlineToggle,
  deadlinesShown,
  onToggleDeadlines,
}: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none sm:flex-wrap sm:overflow-visible">
      <LayerChip
        label="Spotkania"
        shown={meetingsShown}
        shownDot="bg-dark"
        hiddenDot="bg-gray-200"
        onToggle={onToggleMeetings}
      />
      {showDeadlineToggle && (
        <LayerChip
          label="Terminy zadań"
          shown={deadlinesShown}
          shownDot="border-[1.5px] border-dark"
          hiddenDot="border-[1.5px] border-gray-300"
          onToggle={onToggleDeadlines}
        />
      )}
      <span aria-hidden="true" className="h-5 w-px shrink-0 bg-gray-200" />
      {projects.map((project) => {
        const isHidden = hiddenProjectIds.includes(project.id);
        const dotColor = isHidden
          ? 'bg-gray-200'
          : (PROJECT_COLORS.find((option) => option.id === project.color)
              ?.className ?? 'bg-gray-300');

        return (
          <button
            type="button"
            key={project.id}
            aria-pressed={!isHidden}
            onClick={() => onToggle(project.id)}
            className={`${CHIP_CLASSES} ${isHidden ? 'text-gray-400' : 'text-dark'}`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`}
            ></span>
            <span>{project.name}</span>
          </button>
        );
      })}
    </div>
  );
}
