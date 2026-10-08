import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useDeleteMeeting() {
  return useApiMutation((token, id: string) => api.deleteMeeting(token, id), {
    invalidates: [['meetings']],
  });
}
