import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api, type AccountStatus } from '../../../lib/api';

export function useSetAccountStatus() {
  const { requireToken } = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      accountStatus,
    }: {
      id: string;
      accountStatus: AccountStatus;
    }) => api.setAccountStatus(requireToken(), id, accountStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}
