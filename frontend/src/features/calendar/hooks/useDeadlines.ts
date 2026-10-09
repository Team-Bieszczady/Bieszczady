import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';
import type { Deadline } from '../types';

export function useDeadlines(from: string, to: string) {
  const { hasToken, requireToken } = useAuthToken();
  return useQuery({
    queryKey: ['deadlines', from, to],
    queryFn: async (): Promise<Deadline[]> => {
      const deadlines = await api.getDeadlines(requireToken(), from, to);
      return deadlines.map(({ dueDate, ...deadline }) => ({
        ...deadline,
        date: dueDate.slice(0, 10),
      }));
    },
    enabled: hasToken,
  });
}
