import { PROJECT_COLORS } from '../../projects/constants';
import { sampleProjects } from '../sampleProjects';

export function ProjectFilter() {
  const projects = sampleProjects;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {projects.map((project) => (
        <button
          type="button"
          key={project.id}
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-xs font-medium text-dark"
        >
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${PROJECT_COLORS.find((option) => option.id === project.color)?.className ?? 'bg-gray-300'}`}
          ></span>
          <span>{project.name}</span>
        </button>
      ))}
      <span className="ml-auto text-xs text-darkGreen">Kolory projektów</span>
    </div>
  );
}
