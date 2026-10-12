import { useEffect, useState } from 'react';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { formatFileSize } from '../../features/documents/utils/formatters';
import toast from 'react-hot-toast';

const DROPZONE_TOAST_ID = 'file-dropzone';
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

interface Props {
  value: File | null;
  onChange: (file: File | null) => void;
}

export function FileDropzone({ value, onChange }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const accept = (file: File | null) => {
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `Plik jest za duży. Największy dopuszczalny rozmiar to ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`,
        { id: DROPZONE_TOAST_ID },
      );
      onChange(null);
      return;
    }
    onChange(file);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) {
        return;
      }
      if (files.length > 1) {
        toast.error('Wybierz jeden plik', { id: DROPZONE_TOAST_ID });
        return;
      }
      accept(files[0]);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  });

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => {
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 1) {
          toast.error('Wybierz jeden plik', { id: DROPZONE_TOAST_ID });
          return;
        }

        accept(e.dataTransfer.files?.[0] ?? null);
      }}

      className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragging
          ? 'border-darkGreen bg-lightGreen'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <input
        type="file"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />

      <IoCloudUploadOutline className="h-8 w-8 text-gray-400" />

      {value ? (
        <>
          <p className="text-sm font-medium text-dark">{value.name}</p>
          <p className="text-xs text-gray-400">{formatFileSize(value.size)}</p>
        </>
      ) : (
        <>
          <p className="text-sm text-dark">
            Przeciągnij plik lub{' '}
            <span className="font-semibold text-darkGreen">
              wybierz z dysku
            </span>
          </p>
          <p className="text-xs text-gray-400">
            Dokumenty, arkusze, obrazy i archiwa · maks. 25 MB
          </p>
        </>
      )}
    </label>
  );
}
