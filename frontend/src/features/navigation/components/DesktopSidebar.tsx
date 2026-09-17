import Logo from './Logo';
import SectionLabel from './SectionLabel';
import OrgNavList from './OrgNavList';
import ProjectInfoCard from './ProjectInfoCard';
import UserFooter from './UserFooter';
import { useNavData } from '../hooks/useNavData';
import { useProjects } from '../../projects/hooks/useProjectsApi';
import { useSelectedProject } from '../../../context/useSelectedProject';

export default function DesktopSidebar() {
  const {
    initials,
    name,
    avatarSrc,
    isDirector,
    orgNavItems,
    projectNavItems,
  } = useNavData();
  const { projectId } = useSelectedProject();
  const projects = useProjects(false, !!projectId);
  const project = projects.data?.find((entry) => entry.id === projectId);

  return (
    <div className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto nav-scrollbar">
        <Logo />
        <SectionLabel label="Organizacja" />
        <OrgNavList items={orgNavItems} useDesktopStyle />
        {project && <ProjectInfoCard project={project} />}
        <SectionLabel label="Szczegóły Projektu" />
        <OrgNavList items={projectNavItems} useDesktopStyle />
      </div>
      <UserFooter
        initials={initials}
        name={name}
        avatarSrc={avatarSrc}
        isDirector={isDirector}
        className="shrink-0 bg-white"
      />
    </div>
  );
}
