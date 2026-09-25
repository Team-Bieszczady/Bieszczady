import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useGrantAccess(projectId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: async (body: {
      userId: string;
      level: 'VIEW' | 'EDIT';
      folderId?: string;
      documentId?: string;
    }) => {
      return await api.grantDocumentAccess(requireToken(), projectId, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-list', projectId] });
    },
  });
}
