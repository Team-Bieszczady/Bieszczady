import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useAuthToken } from '../context/useAuthToken';

export function useApiMutation<TVariables, TResult>(
  mutationFn: (accessToken: string, variables: TVariables) => Promise<TResult>,
  options: { invalidates?: QueryKey[] } = {},
) {
  const { requireToken } = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: TVariables) =>
      mutationFn(requireToken(), variables),
    onSuccess: () => {
      for (const queryKey of options.invalidates ?? []) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

