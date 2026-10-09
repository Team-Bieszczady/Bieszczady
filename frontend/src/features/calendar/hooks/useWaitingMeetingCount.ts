import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useWaitingMeetingCount(enabled: boolean) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['meetings', 'waiting-count'],
    queryFn: () => api.getWaitingMeetingCount(requireToken()),
    enabled: hasToken && enabled,
  });
}
