import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useParticipants(
  search: string,
  options: { enabled?: boolean } = {},
) {
  const { hasToken, requireToken } = useAuthToken();
  const isWanted = options.enabled ?? true;

  return useQuery({
    queryKey: ['participants', search],
    queryFn: () => api.getParticipants(requireToken(), search),
    enabled: hasToken && isWanted,
    placeholderData: keepPreviousData,
  });
}
