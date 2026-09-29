import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';

export function useMoveFolder(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: async ({
      folderId,
      parentId,
    }: {
      folderId: string;
      parentId: string | null;
    }) => {
      return api.updateFolder(requireToken(), projectId, folderId, {
        parentId,
      });
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
