import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/useAuth';
import { Spinner } from './ui/Spinner';

export default function RequireAuth() {
  const { user, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner variant="dark" size="32" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
