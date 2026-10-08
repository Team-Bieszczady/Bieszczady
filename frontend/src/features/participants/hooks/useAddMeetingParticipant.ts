import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useAddMeetingParticipant(meetingId: string) {
  return useApiMutation(
    (token, participantId: string) =>
      api.addMeetingParticipant(token, meetingId, participantId),
    { invalidates: [['meeting-participants', meetingId], ['participants']] },
  );
}
