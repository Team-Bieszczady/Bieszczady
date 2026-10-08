import toast from 'react-hot-toast';
import { useAuthToken } from '../../../context/useAuthToken';
import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useUploadAttendanceFile(meetingId: string) {
  return useApiMutation(
    (token, file: File) => api.uploadAttendanceFile(token, meetingId, file),
    { invalidates: [['meetings']] },
  );
}

export function useDeleteAttendanceFile(meetingId: string) {
  return useApiMutation(
    (token, fileId: string) =>
      api.deleteAttendanceFile(token, meetingId, fileId),
    { invalidates: [['meetings']] },
  );
}

export function useDownloadAttendanceFile(meetingId: string) {
  const { requireToken } = useAuthToken();

  return async (fileId: string, fileName: string) => {
    try {
      const blob = await api.downloadAttendanceFile(
        requireToken(),
        meetingId,
        fileId,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };
}
