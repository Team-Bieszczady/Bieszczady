import MobileNav from './components/MobileNav';
import DesktopSidebar from './components/DesktopSidebar';
import ProjectBottomBar from './components/ProjectBottomBar';
import { PROJECT_NAV_ITEMS } from './data';

export default function Navigation() {
  return (
    <>
      <MobileNav />
      <DesktopSidebar />
      <ProjectBottomBar items={PROJECT_NAV_ITEMS} />
    </>
  );
}
