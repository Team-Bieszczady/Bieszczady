import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type MeetingChanges } from '../../../lib/api';

export function useUpdateMeeting() {
  return useApiMutation(
    (token, { id, changes }: { id: string; changes: MeetingChanges }) =>
      api.updateMeeting(token, id, changes),
    { invalidates: [['meetings']] },
  );
}
