import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';

export function useDeleteFolder(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();
  return useMutation({
    mutationFn: async (folderId: string) => {
      return api.deleteFolder(requireToken(), projectId, folderId);
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
