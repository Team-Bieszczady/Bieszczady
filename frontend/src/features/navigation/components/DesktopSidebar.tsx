import Logo from './Logo';
import SectionLabel from './SectionLabel';
import OrgNavList from './OrgNavList';
import ProjectNavList from './ProjectNavList';
import ProjectInfoCard from './ProjectInfoCard';
import UserFooter from './UserFooter';
import { ORG_NAV_ITEMS, PROJECT_NAV_ITEMS, MOCK_USER, MOCK_SELECTED_PROJECT } from '../data';

export default function DesktopSidebar() {
  return (
    <div className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray overflow-y-auto">
      <Logo />
      <SectionLabel label="Organizacja" />
      <OrgNavList items={ORG_NAV_ITEMS} useDesktopStyle />
      <ProjectInfoCard
        name={MOCK_SELECTED_PROJECT.name}
        status={MOCK_SELECTED_PROJECT.status}
      />
      <SectionLabel label="Szczegóły Projektu" />
      <ProjectNavList items={PROJECT_NAV_ITEMS} />
      <div className="mt-auto">
        <UserFooter initials={MOCK_USER.initials} name={MOCK_USER.name} />
      </div>
    </div>
  );
}
