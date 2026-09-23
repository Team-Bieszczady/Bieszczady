import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useUpdateFolder(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();
  return useMutation({
    mutationFn: async ({
      folderId,
      name,
    }: {
      folderId: string;
      name: string;
    }) => {
      return api.updateFolder(requireToken(), projectId, folderId, {
        name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
    },
  });
}
