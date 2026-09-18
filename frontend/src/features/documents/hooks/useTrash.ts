import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useTrash(projectId: string) {
  const { hasToken, requireToken } = useAuthToken();
  return useQuery({
    queryKey: ['trash', projectId],
    queryFn: async () => {
      return await api.getTrash(requireToken(), projectId);
    },

    enabled: hasToken,
  });
}
