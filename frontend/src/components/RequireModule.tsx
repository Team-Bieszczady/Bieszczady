import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/useAuth';
import { useSelectedProject } from '../context/useSelectedProject';
import { useProjects } from '../features/projects/hooks/useProjectsApi';
import {
  PROJECT_SCOPED_MODULES,
  hasModule,
  hasProjectModule,
  type ModuleKey,
} from '../lib/modules';

export default function RequireModule({ module }: { module: ModuleKey }) {
  const { user } = useAuth();
  const { projectId } = useSelectedProject();
  const isScoped = PROJECT_SCOPED_MODULES.includes(module);
  const projects = useProjects(false, isScoped && hasModule(user, 'PROJECTS'));

  if (!hasModule(user, module)) {
    return <Navigate to="/" replace />;
  }
  if (isScoped && projects.isLoading) {
    return null;
  }
  const project = projects.data?.find((item) => item.id === projectId);
  if (!hasProjectModule(user, project, module)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
