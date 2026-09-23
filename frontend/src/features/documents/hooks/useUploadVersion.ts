import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthToken } from '../../../context/useAuthToken';

interface UploadVersionInput {
  file: File;
  changeNote?: string;
}
export function useUploadVersion(
  projectId: string,
  folderId: string,
  documentId: string,
) {
  const { requireToken } = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadVersionInput) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      if (payload.changeNote) {
        formData.append('changeNote', payload.changeNote);
      }
      return api.uploadVersion(requireToken(), projectId, documentId, formData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['versions', projectId, documentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['documents', projectId, folderId],
      });
    },
  });
}
