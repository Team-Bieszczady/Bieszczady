import { useContext } from 'react';
import { SelectedProjectContext } from './SelectedProjectContextValue';

export function useSelectedProject(): {
  projectId: string | null;
  setProjectId: (id: string) => void;
} {
  const context = useContext(SelectedProjectContext);
  if (context === undefined) {
    throw new Error(
      'useSelectedProject must be used within a SelectedProjectProvider',
    );
  }
  return context;
}
