import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';

export function useApproveDocument(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: async (documentId: string) => {
      return api.approveDocument(requireToken(), projectId, documentId);
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
