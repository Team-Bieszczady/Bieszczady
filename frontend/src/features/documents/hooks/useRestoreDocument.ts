import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trash', projectId],
      });
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({
        queryKey: ['pending-count', projectId],
      });
    },
  });
}
