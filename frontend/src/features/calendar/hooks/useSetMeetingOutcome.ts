import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type MeetingOutcome } from '../../../lib/api';

export function useSetMeetingOutcome() {
  return useApiMutation(
    (token, { id, outcome }: { id: string; outcome: MeetingOutcome }) =>
      api.setMeetingOutcome(token, id, outcome),
    { invalidates: [['meetings']] },
  );
}
