import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useCreateFolderTemplate(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: async () => {
      return await api.createFolderTemplate(requireToken(), projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
    },
  });
}
