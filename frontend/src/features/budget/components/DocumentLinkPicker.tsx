import { Select } from '../../../components/ui/Select';
import { FIELD_LABEL_CLASSES } from '../../../components/ui/formStyles';
import { useDocuments } from '../../documents/hooks/useDocuments';
import type { DocumentLink } from '../types';

interface DocumentLinkPickerProps {
  projectId: string;
  folderPaths: Map<string, string> | null;
  value: DocumentLink | null;
  onChange: (link: DocumentLink | null) => void;
}

export function DocumentLinkPicker({
  projectId,
  folderPaths,
  value,
  onChange,
}: DocumentLinkPickerProps) {
  const folderId = value?.folderId ?? null;
  const documentsQuery = useDocuments(projectId, folderId);

  if (folderPaths === null) {
    return (
      <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] text-grayText">
        Nie masz dostępu do modułu Dokumenty, więc nie możesz wskazać dokumentu.
      </p>
    );
  }

  if (folderPaths.size === 0) {
    return (
      <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] text-grayText">
        Projekt nie ma jeszcze folderów w Dokumentach.
      </p>
    );
  }

  const folderOptions = [...folderPaths]
    .map(([id, path]) => ({ value: id, label: path }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pl'));
  const documents = documentsQuery.data ?? [];
  const fileOptions = documents.map((document) => ({
    value: document.id,
    label: document.name,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={FIELD_LABEL_CLASSES}>Folder</label>
        <Select
          value={folderId ?? ''}
          onChange={(nextId) =>
            onChange(nextId ? { kind: 'FOLDER', folderId: nextId } : null)
          }
          options={folderOptions}
          placeholder="Wybierz folder"
          size="md"
        />
      </div>
      <div>
        <label className={FIELD_LABEL_CLASSES}>
          Plik w folderze{' '}
          <span className="font-normal text-gray-400">opcjonalnie</span>
        </label>
        <Select
          value={value?.kind === 'FILE' ? value.documentId : ''}
          onChange={(documentId) => {
            if (!folderId) return;
            const document = documents.find(({ id }) => id === documentId);
            onChange(
              document
                ? {
                    kind: 'FILE',
                    folderId,
                    documentId: document.id,
                    name: document.name,
                  }
                : { kind: 'FOLDER', folderId },
            );
          }}
          options={fileOptions}
          placeholder={
            !folderId
              ? 'Najpierw wybierz folder'
              : documentsQuery.isPending
                ? 'Wczytywanie…'
                : 'Cały folder'
          }
          size="md"
        />
      </div>
    </div>
  );
}
