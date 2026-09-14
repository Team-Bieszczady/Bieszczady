import { useAuth } from '../../../context/useAuth';
import { useSelectedProject } from '../../../context/useSelectedProject';
import { hasModule } from '../../../lib/modules';
import { usePeople } from '../../people/hooks/usePeople';
import { useCurrentUser } from '../../people/hooks/useCurrentUser';
import { useProjects } from '../../projects/hooks/useProjectsApi';
import { ORG_NAV_ITEMS, PROJECT_NAV_ITEMS, type NavItem } from '../data';

interface NavData {
  initials: string;
  name: string;
  avatarSrc: string | null;
  isDirector: boolean;
  orgNavItems: NavItem[];
  projectNavItems: NavItem[];
}

export function useNavData(): NavData {
  const { user } = useAuth();
  const { projectId } = useSelectedProject();
  const { data: people = [] } = usePeople({
    enabled: hasModule(user, 'PEOPLE'),
  });
  const { data: projects = [] } = useProjects(
    false,
    hasModule(user, 'PROJECTS'),
  );
  const { data: me } = useCurrentUser();

  const counts: Record<string, number> = {
    people: people.length,
    projects: projects.length,
  };

  const selectedProject = projects.find((project) => project.id === projectId);
  const taskBadge = selectedProject
    ? selectedProject.viewerManages
      ? selectedProject.taskCounts.total
      : selectedProject.taskCounts.mine
    : 0;

  const isDirector = user?.isDirector ?? false;

  const canSee = (item: NavItem) =>
    item.directorOnly
      ? isDirector
      : !!item.module && hasModule(user, item.module);

  const orgNavItems = ORG_NAV_ITEMS.filter(canSee).map((item) =>
    item.id in counts ? { ...item, count: counts[item.id] } : item,
  );

  return {
    initials: user
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : '',
    name: user ? `${user.firstName} ${user.lastName}` : '',
    avatarSrc: me?.avatar ?? null,
    isDirector,
    orgNavItems,

    projectNavItems: hasModule(user, 'PROJECTS')
      ? PROJECT_NAV_ITEMS.filter(canSee).map((item) =>
          item.id === 'tasks' && selectedProject && taskBadge > 0
            ? { ...item, count: taskBadge }
            : item,
        )
      : [],
  };
}
