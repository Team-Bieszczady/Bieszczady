import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/useAuth';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { mapUserToPerson } from '../utils/mapUserToPerson';

export function usePeople(options: { enabled?: boolean } = {}) {
  const { user } = useAuth();
  const { hasToken, requireToken } = useAuthToken();
  const includeDeleted = !!user?.isDirector;

  return useQuery({
    queryKey: ['people', { includeDeleted }],
    queryFn: async () => {
      const users = await api.getUsers(requireToken(), { includeDeleted });
      return users.map(mapUserToPerson);
    },
    enabled: hasToken && (options.enabled ?? true),
  });
}
