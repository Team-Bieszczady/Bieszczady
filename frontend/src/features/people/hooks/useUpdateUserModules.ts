import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { type ModuleKey } from '../../../lib/modules';

export function useUserModules(userId: string, enabled: boolean) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['user-modules', userId],
    queryFn: async () =>
      (await api.getUserModules(requireToken(), userId)).modules,
    enabled: hasToken && enabled,
  });
}

export function useUpdateUserModules(userId: string) {
  const { requireToken } = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modules: ModuleKey[]) =>
      api.updateUserModules(requireToken(), userId, modules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', userId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['user-modules', userId] });
    },
  });
}
