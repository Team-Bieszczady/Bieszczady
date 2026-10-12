import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type ParticipantChanges } from '../../../lib/api';

interface ParticipantUpdate {
  id: string;
  changes: ParticipantChanges;
}

export function useUpdateParticipant() {
  return useApiMutation(
    (token, update: ParticipantUpdate) =>
      api.updateParticipant(token, update.id, update.changes),
    { invalidates: [['participants']] },
  );
}
