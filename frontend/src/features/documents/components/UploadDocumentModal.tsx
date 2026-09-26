import {
  Controller,
  useForm,
  useWatch,
  type SubmitHandler,
} from 'react-hook-form';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { FileDropzone } from '../../../components/ui/FileDropzone';
import { FieldError } from '../../../components/ui/FieldError';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { type BackendDocument } from '../../../lib/api';
import {
  DOCUMENT_KINDS_OPTIONS,
  type DocumentKind,
} from '../../../lib/documents';
import { showError, showSuccess } from '../utils/toasts';
import { useUploadDocument } from '../hooks/useUploadDocument';
import { useUploadVersion } from '../hooks/useUploadVersion';

export type UploadMode = 'document' | 'version';

const NAME_MAX_LENGTH = 200;
const CHANGE_NOTE_MAX_LENGTH = 500;

interface Inputs {
  mode: UploadMode;
  file: File | null;
  name: string;
  kind: DocumentKind;
  versionForId: string;
  changeNote: string;
}

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
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      mode: initialMode,
      file: null,
      name: '',
      kind: 'CONTRACT',
      versionForId: initialDocumentId ?? '',
      changeNote: '',
    },
  });

  const mode = useWatch({ control, name: 'mode' });
  const versionForId = useWatch({ control, name: 'versionForId' });

  const upload = useUploadDocument(projectId, folderId);
  const uploadVersion = useUploadVersion(projectId, folderId, versionForId);

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

  const submit: SubmitHandler<Inputs> = (data) => {
    if (!data.file) {
      return;
    }

    if (data.mode === 'document') {
      upload.mutate(
        { name: data.name.trim(), kind: data.kind, file: data.file },
        {
          onSuccess: () => {
            showSuccess('Dokument wgrany');
            onClose();
          },
          onError: showError,
        },
      );
      return;
    }

    uploadVersion.mutate(
      { file: data.file, changeNote: data.changeNote.trim() },
      {
        onSuccess: () => {
          showSuccess('Nowa wersja wgrana');
          onClose();
        },
        onError: showError,
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Wgraj plik">
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div>
          <Controller
            name="file"
            control={control}
            rules={{ required: 'Wybierz plik' }}
            render={({ field }) => (
              <FileDropzone value={field.value} onChange={field.onChange} />
            )}
          />
          <FieldError message={errors.file?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-dark/75 cursor-pointer">
            <input
              type="radio"
              value="document"
              className="accent-darkGreen"
              {...register('mode')}
            />
            Nowy dokument
          </label>

          <label className="flex items-center gap-2 text-xs font-semibold text-dark/75 cursor-pointer">
            <input
              type="radio"
              value="version"
              className="accent-darkGreen"
              {...register('mode')}
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
                className={INPUT_CLASSES}
                {...register('name', {
                  maxLength: {
                    value: NAME_MAX_LENGTH,
                    message: `Najwyżej ${NAME_MAX_LENGTH} znaków`,
                  },
                  validate: (value, values) =>
                    values.mode !== 'document' ||
                    value.trim().length > 0 ||
                    'Podaj nazwę dokumentu',
                })}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL_CLASSES}>
                  Rodzaj <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="kind"
                  control={control}
                  rules={{ required: 'Wybierz rodzaj' }}
                  render={({ field }) => (
                    <Select
                      size="md"
                      options={DOCUMENT_KINDS_OPTIONS}
                      placeholder="Wybierz"
                      value={field.value}
                      onChange={(v) => field.onChange(v as DocumentKind)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <FieldError message={errors.kind?.message} />
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
              <Controller
                name="versionForId"
                control={control}
                rules={{
                  validate: (value, values) =>
                    values.mode !== 'version' ||
                    value.length > 0 ||
                    'Wybierz dokument',
                }}
                render={({ field }) => (
                  <Select
                    size="md"
                    options={documentOptions}
                    placeholder="Wybierz"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              <FieldError message={errors.versionForId?.message} />
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
                className={INPUT_CLASSES}
                {...register('changeNote', {
                  maxLength: {
                    value: CHANGE_NOTE_MAX_LENGTH,
                    message: `Najwyżej ${CHANGE_NOTE_MAX_LENGTH} znaków`,
                  },
                })}
              />
              <FieldError message={errors.changeNote?.message} />
            </div>
          </>
        )}

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            isPending={
              mode === 'document' ? upload.isPending : uploadVersion.isPending
            }
            className="font-medium!"
          >
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
