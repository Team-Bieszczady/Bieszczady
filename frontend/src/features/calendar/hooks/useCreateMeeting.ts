import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type NewMeeting } from '../../../lib/api';

export function useCreateMeeting() {
  return useApiMutation(
    (token, meeting: NewMeeting) => api.createMeeting(token, meeting),
    { invalidates: [['meetings']] },
  );
}
