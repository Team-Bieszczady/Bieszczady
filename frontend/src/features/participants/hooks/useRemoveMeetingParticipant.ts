import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useRemoveMeetingParticipant(meetingId: string) {
  return useApiMutation(
    (token, participantId: string) =>
      api.removeMeetingParticipant(token, meetingId, participantId),
    { invalidates: [['meeting-participants', meetingId], ['participants']] },
  );
}
