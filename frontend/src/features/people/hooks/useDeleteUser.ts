import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useDeleteUser() {
  const { requireToken } = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.softDeleteUser(requireToken(), id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}
