import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useMeeting(id: string) {
  const { hasToken, requireToken } = useAuthToken();
  return useQuery({
    queryKey: ['meetings', 'detail', id],
    queryFn: async () => {
      const meeting = await api.getMeeting(requireToken(), id);
      return { ...meeting, date: meeting.date.slice(0, 10) };
    },
    enabled: hasToken,
  });
}
