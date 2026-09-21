import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useRestoreVersion(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: ({
      documentId,
      versionNo,
    }: {
      documentId: string;
      versionNo: number;
    }) => api.restoreVersion(requireToken(), projectId, documentId, versionNo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', projectId] });
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
    },
  });
}
