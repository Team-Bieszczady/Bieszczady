import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useDeleteDocumentPermanently(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();
  return useMutation({
    mutationFn: async (documentId: string) => {
      return api.deleteDocumentPermanently(
        requireToken(),
        projectId,
        documentId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash', projectId] });
      queryClient.invalidateQueries({
        queryKey: ['pending-count', projectId],
      });
    },
  });
}
