import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useDocumentAccess(
  projectId: string,
  target: { folderId?: string; documentId?: string },
) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['access-list', projectId, target],
    queryFn: async () => {
      return await api.getDocumentAccess(requireToken(), projectId, target);
    },
    enabled: hasToken && Boolean(target.folderId || target.documentId),
  });
}
