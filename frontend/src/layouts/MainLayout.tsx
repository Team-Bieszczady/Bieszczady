import { Outlet } from 'react-router';
import Navigation from '../features/navigation/Navigation';

export default function MainLayout() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      <Navigation />
      <main className="flex-1 lg:ml-64 pb-24 lg:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
