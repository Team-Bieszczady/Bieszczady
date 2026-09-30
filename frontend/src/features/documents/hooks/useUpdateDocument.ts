import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';

export function useUpdateDocument(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();
  return useMutation({
    mutationFn: async ({
      documentId,
      name,
    }: {
      documentId: string;
      name: string;
    }) => {
      return api.updateDocument(requireToken(), projectId, documentId, {
        name,
      });
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
