import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import type { DocumentKind } from '../../../lib/documents';

interface UploadDocumentInput {
  name: string;
  kind: DocumentKind;
  file: File;
  asDraft: boolean;
  asSigned: boolean;
}

export function useUploadDocument(projectId: string, folderId: string) {
  const queryClient = useQueryClient();
  const { requireToken } = useAuthToken();

  return useMutation({
    mutationFn: (payload: UploadDocumentInput) => {
      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('kind', payload.kind);
      formData.append('file', payload.file);
      if (payload.asDraft) {
        formData.append('asDraft', 'true');
      }
      if (payload.asSigned) {
        formData.append('asSigned', 'true');
      }

      return api.uploadDocument(requireToken(), projectId, folderId, formData);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['documents', projectId, folderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pending-count', projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ['pending-documents', projectId],
      });
      queryClient.invalidateQueries({ queryKey: ['folders', projectId] });
    },
  });
}
