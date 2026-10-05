import { PROJECT_COLORS } from '../../projects/constants';
import type { CalendarProject } from '../types';

type Props = {
  projects: CalendarProject[];
  hiddenProjectIds: string[];
  onToggle: (id: string) => void;
};

export function ProjectFilter({ projects, hiddenProjectIds, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
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
            className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium ${isHidden ? 'text-gray-400' : 'text-dark'}`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`}
            ></span>
            <span>{project.name}</span>
          </button>
        );
      })}
      <span className="ml-auto text-xs text-darkGreen">Kolory projektów</span>
    </div>
  );
}
