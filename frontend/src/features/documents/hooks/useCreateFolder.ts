import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateFolder(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();
  return useMutation({
    mutationFn: async ({
      name,
      parentId,
    }: {
      name: string;
      parentId?: string;
    }) => {
      return api.createFolder(requireToken(), projectId, { name, parentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
    },
  });
}
