import { Link } from 'react-router';
import type { BackendProjectCard } from '../../../lib/projectsApi';
import ProjectStatusBadge from './ProjectStatusBadge';
import ArchivedBadge from './ArchivedBadge';
import ProjectCardActions from './ProjectCardActions';
import ProgressBar from './ProgressBar';
import { useSelectedProject } from '../../../context/useSelectedProject';
import { formatBudget } from '../utils/formatBudget';
import { truncateText } from '../../../lib/truncate';

interface ProjectCardProps {
  project: BackendProjectCard;
  canManage?: boolean;
}

export default function ProjectCard({
  project,
  canManage = false,
}: ProjectCardProps) {
  const { projectId, setProjectId } = useSelectedProject();
  const isSelected = project.id === projectId;
  const isArchived = project.archivedAt !== null;

  const frame = isArchived
    ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
    : isSelected
      ? 'border-darkGreen bg-lightGreen/40 hover:bg-lightGreen/60'
      : 'border-gray-200 bg-white hover:bg-gray-50';

  return (
    <Link
      to="/project/overview"
      onClick={() => setProjectId(project.id)}
      className={`flex h-full flex-col gap-2 rounded-xl border px-3.5 py-3 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:ring-offset-2 min-[400px]:gap-2.5 min-[400px]:px-4 min-[400px]:py-4 ${frame}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          className={`min-w-0 text-sm font-bold leading-snug min-[400px]:text-base ${
            isArchived ? 'text-grayText' : 'text-dark'
          }`}
          title={project.name}
        >
          {truncateText(project.name, 25)}
        </h2>

        <div className="flex shrink-0 items-start gap-1">
          {isArchived ? (
            <ArchivedBadge />
          ) : (
            <ProjectStatusBadge status={project.status} size="sm" />
          )}
          {canManage && <ProjectCardActions project={project} />}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-2 min-[400px]:gap-2.5">
        <div className="flex gap-3 text-[11px] font-medium text-grayText min-[400px]:gap-4 min-[400px]:text-xs">
          <span>{project.stageLabel}</span>
          <span>{project.peopleCount} osób</span>
        </div>

        <div className="flex items-center justify-between text-[11px] min-[400px]:text-xs">
          <span className="font-medium text-grayText">
            Budżet {formatBudget(project.budgetAmount)}
          </span>
          <span
            className={`font-bold ${isArchived ? 'text-grayText' : 'text-dark'}`}
          >
            {project.progress}% wykonano
          </span>
        </div>

        <ProgressBar percent={project.progress} />
      </div>
    </Link>
  );
}
