import { QueryState } from '../components/ui/QueryState';
import ProjectCard from '../features/projects/components/ProjectCard';
import { useArchivedProjects } from '../features/projects/hooks/useProjectsApi';
import type { BackendProjectCard } from '../lib/projectsApi';
import { useAuth } from '../context/useAuth';

interface ArchiveListProps {
  projects: BackendProjectCard[];
  canManage: boolean;
}

function ArchiveList({ projects, canManage }: ArchiveListProps) {
  return (
    <div className="px-5 min-[400px]:px-6 sm:px-8 pt-20 pb-8 lg:pt-8 max-w-7xl mx-auto">
      <h1 className="mb-8 text-base font-bold text-dark 500:text-xl lg:text-2xl">
        Archiwum
      </h1>

      <p className="mb-4 text-xs text-grayText">
        Zarchiwizowane projekty są tylko do odczytu. Przywróć projekt, aby móc
        go edytować.
      </p>

      {projects.length === 0 ? (
        <p className="py-12 text-center text-sm text-grayText">
          Brak zarchiwizowanych projektów
        </p>
      ) : (
        <div className="animate-fade-in grid gap-4 min-[400px]:gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const archivedQuery = useArchivedProjects();

  return (
    <QueryState
      isLoading={archivedQuery.isLoading}
      isError={archivedQuery.isError}
      error={archivedQuery.error}
      data={archivedQuery.data}
      errorMessage="Nie udało się pobrać archiwum."
      notFoundMessage="Brak zarchiwizowanych projektów."
      refetch={() => void archivedQuery.refetch()}
    >
      {(projects) => (
        <ArchiveList projects={projects} canManage={!!user?.isDirector} />
      )}
    </QueryState>
  );
}
