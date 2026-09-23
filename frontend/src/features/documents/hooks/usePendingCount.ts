import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function usePendingCount(projectId: string | null) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['pending-count', projectId],
    queryFn: async () => {
      return await api.getPendingCount(requireToken(), projectId!);
    },
    enabled: hasToken && projectId !== null,
  });
}
