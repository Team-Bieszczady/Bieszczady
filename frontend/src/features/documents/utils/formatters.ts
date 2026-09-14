export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return `${Math.round(kilobytes)} KB`;
  }

  const megabytes = kilobytes / 1024;
  return `${megabytes.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} MB`;
}
export function fileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? 'PLIK' : fileName.slice(lastDot + 1).toUpperCase();
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('pl-PL');
}
