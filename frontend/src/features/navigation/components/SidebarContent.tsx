import Logo from './Logo';
import SectionLabel from './SectionLabel';
import OrgNavList from './OrgNavList';
import ProjectInfoCard from './ProjectInfoCard';
import UserFooter from './UserFooter';
import { useNavData } from '../hooks/useNavData';

interface SidebarContentProps {
  /** The fixed desktop column; unset renders the drawer treatment. */
  useDesktopStyle?: boolean;
  showNotifications?: boolean;
  onNavigate?: () => void;
}

/**
 * The nav body shared by the fixed desktop sidebar and the mobile drawer:
 * Organizacja, the selected project, Szczegóły Projektu, and the user row
 * pinned below a scrolling list. Only the treatment differs between the two.
 */
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
          // The drawer needs the gap the project card would otherwise supply;
          // on desktop SectionLabel's own lg:mt-0 already handles it.
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
