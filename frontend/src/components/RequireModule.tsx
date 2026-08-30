import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/useAuth';
import { hasModule, type ModuleKey } from '../lib/modules';

export default function RequireModule({ module }: { module: ModuleKey }) {
  const { user } = useAuth();
  if (!hasModule(user, module)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
