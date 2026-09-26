import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
    },
  });
}
