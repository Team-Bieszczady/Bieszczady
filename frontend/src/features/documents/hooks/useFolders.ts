import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useFolders(projectId: string, enabled = true) {
  const { hasToken, requireToken } = useAuthToken();
  return useQuery({
    queryKey: ['folders', projectId],
    queryFn: async () => {
      return await api.getFolders(requireToken(), projectId);
    },

    enabled: hasToken && enabled,
  });
}
