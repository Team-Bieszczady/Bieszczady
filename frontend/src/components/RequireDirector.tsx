import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/useAuth';

export default function RequireDirector() {
  const { user } = useAuth();
  if (!user?.isDirector) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
