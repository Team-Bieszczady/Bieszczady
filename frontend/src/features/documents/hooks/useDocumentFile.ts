import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { showError } from '../utils/toasts';

export function useDocumentFile(projectId: string) {
  const { requireToken } = useAuthToken();

  const download = async (
    documentId: string,
    versionNo: number,
    fileName: string,
  ) => {
    try {
      const blob = await api.downloadVersion(
        requireToken(),
        projectId,
        documentId,
        versionNo,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      showError(error as Error);
    }
  };

  const preview = async (documentId: string, versionNo: number) => {
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
    } catch (error) {
      tab?.close();
      showError(error as Error);
    }
  };

  return { download, preview };
}
