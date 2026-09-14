import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useAuthToken } from '../context/useAuthToken';

export function useApiQuery<T>(
  queryKey: QueryKey,
  queryFn: (accessToken: string) => Promise<T>,
  options: { enabled?: boolean } = {},
) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey,
    queryFn: () => queryFn(requireToken()),
    enabled: hasToken && (options.enabled ?? true),
  });
}
