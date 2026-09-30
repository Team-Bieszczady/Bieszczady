import { useProjects } from './useProjectsApi';

export function useViewerManages(projectId: string) {
  const { data: projects } = useProjects();

  return projects?.find((p) => p.id === projectId)?.viewerManages ?? false;
}
