import type { BackendProjectCard } from '../../../lib/projectsApi';
import ProjectStatusBadge from '../../projects/components/ProjectStatusBadge';

interface ProjectInfoCardProps {
  project: BackendProjectCard;
}

export default function ProjectInfoCard({ project }: ProjectInfoCardProps) {
  return (
    <div className="mx-4 my-3 p-3 border border-gray-200 rounded-lg bg-white">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
        Wybrany projekt
      </p>
      <h3 className="text-sm font-bold text-dark leading-snug mb-1.5">
        {project.name}
      </h3>
      <p
        className="text-[11px] text-gray-400 leading-snug mb-2.5 line-clamp-2"
        title={project.description}
      >
        {project.description}
      </p>
      <div className="flex items-center gap-2">
        <ProjectStatusBadge status={project.status} size="sm" />
        <span className="text-[10px] text-gray-500">{project.stageLabel}</span>
      </div>
    </div>
  );
}
