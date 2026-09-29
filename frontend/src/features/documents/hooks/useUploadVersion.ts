import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { invalidateDocumentQueries } from '../utils/invalidateDocumentQueries';
import { useAuthToken } from '../../../context/useAuthToken';

interface UploadVersionInput {
  file: File;
  changeNote?: string;
  markSigned?: boolean;
}
export function useUploadVersion(projectId: string, documentId: string) {
  const { requireToken } = useAuthToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UploadVersionInput) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      if (payload.changeNote) {
        formData.append('changeNote', payload.changeNote);
      }
      if (payload.markSigned) {
        formData.append('markSigned', 'true');
      }

      return api.uploadVersion(requireToken(), projectId, documentId, formData);
    },
    onSuccess: () => invalidateDocumentQueries(queryClient, projectId),
  });
}
