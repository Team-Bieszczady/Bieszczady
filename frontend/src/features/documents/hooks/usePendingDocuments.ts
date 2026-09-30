import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function usePendingDocuments(projectId: string) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['pending-documents', projectId],
    queryFn: async () => {
      return await api.getPendingDocuments(requireToken(), projectId);
    },
    enabled: hasToken,
  });
}
