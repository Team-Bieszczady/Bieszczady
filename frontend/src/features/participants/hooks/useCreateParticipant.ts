import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type ParticipantChanges } from '../../../lib/api';

export function useCreateParticipant() {
  return useApiMutation(
    (token, participant: ParticipantChanges) =>
      api.createParticipant(token, participant),
    { invalidates: [['participants']] },
  );
}
