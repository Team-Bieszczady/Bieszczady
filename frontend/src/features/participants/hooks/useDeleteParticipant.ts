import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useDeleteParticipant() {
  return useApiMutation(
    (token, id: string) => api.deleteParticipant(token, id),
    { invalidates: [['participants']] },
  );
}
