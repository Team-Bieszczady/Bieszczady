import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

export function useParticipantHistory(participantId: string) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['participants', 'history', participantId],
    queryFn: () => api.getParticipantHistory(requireToken(), participantId),
    enabled: hasToken,
  });
}
