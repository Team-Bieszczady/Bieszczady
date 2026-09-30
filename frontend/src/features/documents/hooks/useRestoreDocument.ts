import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';

export function useRestoreDocument(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();
  return useMutation({
    mutationFn: async ({
      documentId,
      folderId,
    }: {
      documentId: string;
      folderId?: string;
    }) => {
      return api.restoreDocument(requireToken(), projectId, documentId, {
        folderId,
      });
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
