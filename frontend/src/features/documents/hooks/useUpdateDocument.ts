import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useUpdateDocument(projectId: string, folderId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();
  return useMutation({
    mutationFn: async ({
      documentId,
   name
      
    }: {
      documentId: string;
      name: string;
    }) => {
      return api.updateDocument(requireToken(), projectId, documentId, {
        name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['documents', projectId, folderId],
      });
    },
  });
}
