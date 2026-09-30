import SidebarContent from './SidebarContent';

export default function DesktopSidebar() {
  return (
    <div className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-hidden">
      <SidebarContent useDesktopStyle showNotifications />
    </div>
  );
}
