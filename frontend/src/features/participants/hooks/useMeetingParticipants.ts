import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useMeetingParticipants(meetingId: string) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['meeting-participants', meetingId],
    queryFn: () => api.getMeetingParticipants(requireToken(), meetingId),
    enabled: hasToken,
  });
}
