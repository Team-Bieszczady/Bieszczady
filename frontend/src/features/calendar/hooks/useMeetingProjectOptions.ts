import { useApiQuery } from '../../../hooks/useApiQuery';
import { api } from '../../../lib/api';

export function useMeetingProjectOptions() {
  return useApiQuery(['meeting-project-options'], (token) =>
    api.getMeetingProjectOptions(token),
  );
}
