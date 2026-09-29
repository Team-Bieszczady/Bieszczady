import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { showError } from '../utils/toasts';

const TEXT_TYPES = ['text/plain', 'text/csv', 'application/csv'];

async function asUtf8Text(blob: Blob) {
  const bytes = await blob.arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder('windows-1250').decode(bytes);
  }
  return new Blob([text], { type: 'text/plain;charset=utf-8' });
}

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

      setTimeout(() => URL.revokeObjectURL(url), 1000);
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
      const type = blob.type.split(';')[0].trim();
      const shown = TEXT_TYPES.includes(type) ? await asUtf8Text(blob) : blob;
      const url = URL.createObjectURL(shown);

      if (tab) {
        tab.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      tab?.close();
      showError(error as Error);
    }
  };

  return { download, preview };
}
