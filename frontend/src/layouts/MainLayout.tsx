import { Outlet } from 'react-router';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen">
      {/* TODO: sidebar + navigation go here */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
