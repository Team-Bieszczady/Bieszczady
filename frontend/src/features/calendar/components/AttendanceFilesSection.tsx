import toast from 'react-hot-toast';
import { LuDownload, LuFileText, LuTrash2 } from 'react-icons/lu';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import type { AttendanceFile } from '../../../lib/api';
import { formatFileSize } from '../../documents/utils/formatters';
import {
  useDeleteAttendanceFile,
  useDownloadAttendanceFile,
  useUploadAttendanceFile,
} from '../hooks/useAttendanceFiles';

interface AttendanceFilesSectionProps {
  meetingId: string;
  files: AttendanceFile[];
  editable: boolean;
}

const ICON_BUTTON_CLASSES =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-grayText transition-colors hover:bg-gray-100 hover:text-dark disabled:cursor-not-allowed disabled:opacity-40';

export function AttendanceFilesSection({
  meetingId,
  files,
  editable,
}: AttendanceFilesSectionProps) {
  const uploadFile = useUploadAttendanceFile(meetingId);
  const deleteFile = useDeleteAttendanceFile(meetingId);
  const download = useDownloadAttendanceFile(meetingId);

  const upload = (file: File | null) => {
    if (!file) return;

    uploadFile.mutate(file, {
      onSuccess: () => toast.success('Skan dodany'),
      onError: (error) => toast.error(error.message),
    });
  };

  const remove = (file: AttendanceFile) => {
    deleteFile.mutate(file.id, {
      onSuccess: () =>
        toast.success('Skan przeniesiony do Kosza w Dokumentach'),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div>
      <p className="mb-2 text-sm text-dark/80">Skany listy obecności</p>

      {files.length > 0 && (
        <ul className="mb-3 space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2"
            >
              <LuFileText
                size={16}
                className="shrink-0 text-grayText"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-dark">
                  {file.fileName}
                </p>
                <p className="text-[11px] text-grayText">
                  {formatFileSize(file.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Pobierz ${file.fileName}`}
                onClick={() => void download(file.id, file.fileName)}
                className={ICON_BUTTON_CLASSES}
              >
                <LuDownload size={16} />
              </button>
              {editable && file.canDelete && (
                <button
                  type="button"
                  aria-label={`Usuń ${file.fileName}`}
                  disabled={deleteFile.isPending}
                  onClick={() => remove(file)}
                  className={`${ICON_BUTTON_CLASSES} hover:text-darkRed`}
                >
                  <LuTrash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable &&
        (uploadFile.isPending ? (
          <p className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-xs text-grayText">
            Wgrywanie skanu…
          </p>
        ) : (
          <FileDropzone value={null} onChange={upload} />
        ))}

      {!editable && files.length === 0 && (
        <p className="text-xs text-grayText">Nie dodano skanów.</p>
      )}
    </div>
  );
}
