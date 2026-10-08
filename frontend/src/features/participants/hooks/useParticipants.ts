import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useParticipants(search: string) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['participants', search],
    queryFn: () => api.getParticipants(requireToken(), search),
    enabled: hasToken,
    placeholderData: keepPreviousData,
  });
}
