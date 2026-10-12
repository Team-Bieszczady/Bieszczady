import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useRestoreMeeting() {
  return useApiMutation((token, id: string) => api.restoreMeeting(token, id), {
    invalidates: [['meetings']],
  });
}
