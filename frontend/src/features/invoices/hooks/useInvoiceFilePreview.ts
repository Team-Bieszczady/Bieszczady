import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export function useInvoiceFilePreview() {
  const { requireToken } = useAuthToken();

  const preview = async (
    projectId: string,
    documentId: string,
    versionNo: number,
  ) => {
    const tab = window.open('', '_blank');

    try {
      const blob = await api.downloadVersion(
        requireToken(),
        projectId,
        documentId,
        versionNo,
      );
      const url = URL.createObjectURL(blob);

      if (tab) {
        tab.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      tab?.close();
      throw error;
    }
  };

  return { preview };
}
