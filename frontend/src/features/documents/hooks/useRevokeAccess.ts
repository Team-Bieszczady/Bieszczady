import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';

export function useRevokeAccess(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: async (accessId: string) => {
      return await api.revokeDocumentAccess(
        requireToken(),
        projectId,
        accessId,
      );
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
