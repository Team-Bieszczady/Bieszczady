import { useQuery } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { mapUserToPerson } from '../utils/mapUserToPerson';

export function usePerson(id: string | undefined) {
  const { hasToken, requireToken } = useAuthToken();

  return useQuery({
    queryKey: ['people', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('Brak identyfikatora osoby.');
      }
      const user = await api.getUserById(requireToken(), id);
      return mapUserToPerson(user);
    },
    enabled: !!id && hasToken,
  });
}
