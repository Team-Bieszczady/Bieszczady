import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  SelectedProjectContext,
  readStoredProjectId,
  writeStoredProjectId,
} from './SelectedProjectContextValue';
import { useAuth } from './useAuth';

function SelectedProjectStore({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  const [projectId, setProjectIdState] = useState(() =>
    userId ? readStoredProjectId(userId) : null,
  );

  const setProjectId = (id: string) => {
    setProjectIdState(id);
    if (userId) writeStoredProjectId(userId, id);
  };

  return (
    <SelectedProjectContext.Provider value={{ projectId, setProjectId }}>
      {children}
    </SelectedProjectContext.Provider>
  );
}

export function SelectedProjectProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <SelectedProjectStore key={user?.id ?? 'anon'} userId={user?.id ?? null}>
      {children}
    </SelectedProjectStore>
  );
}
