import Logo from './Logo';
import SectionLabel from './SectionLabel';
import OrgNavList from './OrgNavList';
import ProjectInfoCard from './ProjectInfoCard';
import UserFooter from './UserFooter';
import { useNavData } from '../hooks/useNavData';

interface SidebarContentProps {
  useDesktopStyle?: boolean;
  showNotifications?: boolean;
  onNavigate?: () => void;
}

export default function SidebarContent({
  useDesktopStyle = false,
  showNotifications = false,
  onNavigate,
}: SidebarContentProps) {
  const {
    initials,
    name,
    avatarSrc,
    isDirector,
    orgNavItems,
    projectNavItems,
    selectedProject,
  } = useNavData();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto nav-scrollbar">
        <Logo />
        <SectionLabel label="Organizacja" />
        <OrgNavList
          items={orgNavItems}
          useDesktopStyle={useDesktopStyle}
          onNavigate={onNavigate}
        />
        {selectedProject && <ProjectInfoCard project={selectedProject} />}
        {projectNavItems.length > 0 && (
          <div className={!useDesktopStyle && !selectedProject ? 'mt-4' : ''}>
            <SectionLabel label="Szczegóły Projektu" />
            <OrgNavList
              items={projectNavItems}
              useDesktopStyle={useDesktopStyle}
              onNavigate={onNavigate}
            />
          </div>
        )}
      </div>
      <UserFooter
        initials={initials}
        name={name}
        avatarSrc={avatarSrc}
        isDirector={isDirector}
        onNavigate={onNavigate}
        showNotifications={showNotifications}
        className="shrink-0 bg-white"
      />
    </div>
  );
}
