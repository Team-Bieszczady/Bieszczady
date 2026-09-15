import { FiPlus } from 'react-icons/fi';
import { Button } from '../components/ui/Button';
import NotificationBell from '../features/notifications/components/NotificationBell';
import ProjectHeaderCard from '../features/projects/components/overview/ProjectHeaderCard';
import StagesSection from '../features/projects/components/overview/stages/StagesSection';
import GoalsSection from '../features/projects/components/overview/GoalsSection';
import IndicatorsSection from '../features/projects/components/overview/IndicatorsSection';
import ScheduleSection from '../features/projects/components/overview/schedule/ScheduleSection';
import BudgetSection from '../features/projects/components/overview/BudgetSection';
import RisksSection from '../features/projects/components/overview/RisksSection';
import TeamSection from '../features/projects/components/overview/TeamSection';
import { useProjectPlanApi } from '../features/projects/hooks/useProjectPlanApi';
import {
  useMembers,
  useProject,
} from '../features/projects/hooks/useProjectsApi';
import { canChangeStatusOf } from '../features/tasks/utils/taskPermissions';
import type { BackendProject } from '../lib/projectsApi';
import { PageMessage } from '../components/ui/PageMessage';
import { QueryState } from '../components/ui/QueryState';
import { useSelectedProject } from '../context/useSelectedProject';
import { useAuth } from '../context/useAuth';

interface ProjectSectionsProps {
  project: BackendProject;
  canEdit: boolean;
}

function ProjectSections({ project, canEdit }: ProjectSectionsProps) {
  const plan = useProjectPlanApi(project.id);
  const { user } = useAuth();
  const { data: members = [] } = useMembers(project.id);

  return (
    <>
      <ProjectHeaderCard project={project} canEdit={canEdit} />
      <StagesSection plan={plan} project={project} canEdit={canEdit} />
      <GoalsSection projectId={project.id} canEdit={canEdit} />
      <IndicatorsSection canEdit={canEdit} />
      <ScheduleSection
        plan={plan}
        canEdit={canEdit}
        canToggleTask={(task) =>
          project.archivedAt === null &&
          canChangeStatusOf(user, members, task.ownerId)
        }
      />
      <BudgetSection canEdit={canEdit} />
      <RisksSection projectId={project.id} canEdit={canEdit} />
      <TeamSection projectId={project.id} canEdit={canEdit} />
    </>
  );
}

export default function ProjectOverviewPage() {
  const { projectId } = useSelectedProject();
  const { user } = useAuth();
  const projectQuery = useProject(projectId);

  if (!projectId) {
    return (
      <PageMessage message="Nie wybrano projektu. Wybierz go na liście projektów." />
    );
  }

  return (
    <div className="px-5 min-[400px]:px-6 sm:px-8 pt-20 pb-16 lg:pt-8 max-w-7xl mx-auto">
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-end border-b border-gray-200 bg-white px-5 lg:static lg:mb-5 lg:h-auto lg:border-0 lg:bg-transparent lg:px-0">
        <NotificationBell />
      </div>

      <QueryState
        isLoading={projectQuery.isLoading}
        isError={projectQuery.isError}
        error={projectQuery.error}
        data={projectQuery.data}
        errorMessage="Nie udało się pobrać projektu."
        notFoundMessage="Nie znaleziono projektu."
        refetch={() => void projectQuery.refetch()}
      >
        {(project) => (
          <ProjectSections
            key={project.id}
            project={project}
            canEdit={!!user?.isDirector && project.archivedAt === null}
          />
        )}
      </QueryState>

      <Button
        variant="primary"
        size="icon"
        aria-label="Szybkie akcje"
        className="fixed right-4 bottom-20 z-40 rounded-2xl shadow-lg max-lg:h-10 max-lg:w-10 800:hidden"
      >
        <FiPlus className="h-5 w-5" aria-hidden="true" />
      </Button>
    </div>
  );
}
