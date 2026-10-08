import { Outlet } from 'react-router';
import Navigation from '../features/navigation/Navigation';
import MobileTopBar from '../features/navigation/components/MobileTopBar';

export default function MainLayout() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      <Navigation />
      <main className="flex-1 min-w-0 lg:ml-64 lg:h-screen lg:overflow-y-auto nav-scrollbar">
        <MobileTopBar />
        <Outlet />
      </main>
    </div>
  );
}
