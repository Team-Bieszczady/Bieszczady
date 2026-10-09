import { useNavigate } from 'react-router';
import { useSelectedProject } from '../../../context/useSelectedProject';

export function useOpenProjectPage(onLeave: () => void) {
  const { setProjectId } = useSelectedProject();
  const navigate = useNavigate();

  return (projectId: string, path: string) => {
    setProjectId(projectId);
    onLeave();
    void navigate(path);
  };
}
