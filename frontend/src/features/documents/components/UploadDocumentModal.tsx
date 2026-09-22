import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { isApiError, type BackendDocument } from '../../../lib/api';
import {
  DOCUMENT_KINDS_OPTIONS,
  type DocumentKind,
} from '../../../lib/documents';
import { useUploadDocument } from '../hooks/useUploadDocument';
import { useUploadVersion } from '../hooks/useUploadVersion';

export type UploadMode = 'document' | 'version';

interface Props {
  isOpen: boolean;
  projectId: string;
  folderId: string;
  folderName?: string;
  documents: BackendDocument[];
  initialMode: UploadMode;
  initialDocumentId: string | null;
  onClose: () => void;
}

export function UploadDocumentModal({
  isOpen,
  projectId,
  folderId,
  folderName,
  documents,
  initialMode,
  initialDocumentId,
  onClose,
}: Props) {
  const [mode, setMode] = useState<UploadMode>(initialMode);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<DocumentKind>('CONTRACT');
  const [versionForId, setVersionForId] = useState<string | null>(
    initialDocumentId,
  );
  const [changeNote, setChangeNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setVersionForId(initialDocumentId);
    }
  }, [isOpen, initialMode, initialDocumentId]);

  const upload = useUploadDocument(projectId, folderId);
  const uploadVersion = useUploadVersion(
    projectId,
    folderId,
    versionForId ?? '',
  );

  const clear = () => {
    setName('');
    setFile(null);
    setChangeNote('');
    setKind('CONTRACT');
    onClose();
  };

const showError = (error: Error) => {
  const message = isApiError(error) ? error.message : 'Coś poszło nie tak';
  toast.error(message);
};

  const uploadDoc = () => {
    if (!file) {
      return;
    }
    upload.mutate(
      { name, kind, file },
      { onSuccess: clear, onError: showError },
    );
  };

  const uploadNewVersion = () => {
    if (!file) {
      return;
    }
    uploadVersion.mutate(
      { file, changeNote },
      { onSuccess: clear, onError: showError },
    );
  };

  const documentOptions = documents.map((doc) => ({
    value: doc.id,
    label: doc.versions[0]
      ? `${doc.name} (v${doc.versions[0].versionNo})`
      : doc.name,
  }));

  const nextVersionNo = versionForId
    ? (documents.find((doc) => doc.id === versionForId)?.versions[0]
        ?.versionNo ?? 0) + 1
    : null;

  return (
    <Modal isOpen={isOpen} onClose={clear} title="Wgraj plik">
      <div className="space-y-5">
        <FileDropzone value={file} onChange={setFile} />
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-dark/75 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'document'}
              onChange={() => setMode('document')}
              className="accent-darkGreen"
            />
            Nowy dokument
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-dark/75 cursor-pointer">
            <input
              type="radio"
              checked={mode === 'version'}
              onChange={() => setMode('version')}
              className="accent-darkGreen"
            />
            Nowa wersja
          </label>
        </div>

        {mode === 'document' && (
          <>
            <p className="text-xs text-gray-400">
              Dokument trafi do folderu:{' '}
              <span className="font-semibold text-dark">{folderName}</span>
            </p>

            <div>
              <label className={FIELD_LABEL_CLASSES}>
                Nazwa dokumentu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Podaj nazwę..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL_CLASSES}>
                  Rodzaj <span className="text-red-500">*</span>
                </label>
                <Select
                  size="md"
                  options={DOCUMENT_KINDS_OPTIONS}
                  value={kind}
                  onChange={(v) => setKind(v as DocumentKind)}
                  placeholder="Wybierz"
                />
              </div>
            </div>
          </>
        )}

        {mode === 'version' && (
          <>
            <div>
              <label className={FIELD_LABEL_CLASSES}>
                Dokument, do którego dodajesz wersję:{' '}
                <span className="text-red-500">*</span>
              </label>
              <Select
                size="md"
                options={documentOptions}
                value={versionForId ?? ''}
                onChange={(v) => setVersionForId(v)}
                placeholder="Wybierz"
              />
              <p className="mt-1 text-xs text-gray-400">
                Lista zawiera dokumenty z folderu:{' '}
                <span className="font-semibold text-dark">{folderName}</span>
              </p>
            </div>
            {nextVersionNo && (
              <div className="flex items-center gap-2 rounded-lg bg-lightGreen px-3 py-2 text-xs text-darkGreen">
                <IoInformationCircleOutline className="h-4 w-4 shrink-0" />
                <span>
                  Zostanie zapisana jako{' '}
                  <span className="font-bold">v{nextVersionNo}</span>,
                  poprzednie wersje pozostaną w historii
                </span>
              </div>
            )}
            <div>
              <label className={FIELD_LABEL_CLASSES}>Opis zmiany</label>
              <input
                type="text"
                placeholder="Dodaj notatkę, np. Uzupełniono załącznik nr 2"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                className={INPUT_CLASSES}
              />
            </div>
          </>
        )}

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button variant="outline" size="small" type="button" onClick={clear}>
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={mode === 'document' ? uploadDoc : uploadNewVersion}
            disabled={
              mode === 'document'
                ? !name || !file || !kind
                : !file || !versionForId
            }
            isPending={
              mode === 'document' ? upload.isPending : uploadVersion.isPending
            }
            className="font-medium!"
          >
            Zapisz
          </Button>
        </div>
      </div>
    </Modal>
  );
}
