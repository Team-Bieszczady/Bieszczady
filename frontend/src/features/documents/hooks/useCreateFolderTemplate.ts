import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';

export function useCreateFolderTemplate(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: async () => {
      return await api.createFolderTemplate(requireToken(), projectId);
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
