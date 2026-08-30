import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { mapUserToPerson } from '../utils/mapUserToPerson';

export function useCurrentUser() {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const user = await api.getCurrentUser(requireToken());
      return mapUserToPerson(user);
    },
    enabled: hasToken,
    staleTime: 5 * 60_000,
  });
}
