import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useWithdrawToDraft(projectId: string, folderId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: async (documentId: string) => {
      return api.withdrawToDraft(requireToken(), projectId, documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents', projectId, folderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pending-count', projectId],
      });
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
    },
  });
}
