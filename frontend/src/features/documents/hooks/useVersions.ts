import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useVersions(projectId: string, documentId: string | null) {
  const { hasToken, requireToken } = useAuthToken();
  return useQuery({
    queryKey: ['versions', projectId, documentId],
    queryFn: async () => {
      return await api.getVersions(requireToken(), projectId, documentId!);
    },

    enabled: hasToken && !!documentId,
  });
}
