import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useMeetings(from: string, to: string) {
  const { hasToken, requireToken } = useAuthToken();
  return useQuery({
    queryKey: ['meetings', from, to],
    queryFn: async () => {
      const meetings = await api.getMeetings(requireToken(), from, to);
      return meetings.map((meeting) => ({
        ...meeting,
        date: meeting.date.slice(0, 10),
      }));
    },

    enabled: hasToken,
  });
}
