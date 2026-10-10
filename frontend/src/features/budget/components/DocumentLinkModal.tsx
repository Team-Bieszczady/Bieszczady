import { Controller, useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { DocumentLink } from '../types';
import { DocumentLinkPicker } from './DocumentLinkPicker';

interface DocumentLinkModalProps {
  projectId: string;
  positionName: string;
  folderPaths: Map<string, string> | null;
  initialLink: DocumentLink | null;
  onClose: () => void;
  onSave: (link: DocumentLink | null) => void;
}

export function DocumentLinkModal({
  projectId,
  positionName,
  folderPaths,
  initialLink,
  onClose,
  onSave,
}: DocumentLinkModalProps) {
  const { control, handleSubmit } = useForm<{ document: DocumentLink | null }>({
    defaultValues: { document: initialLink },
  });

  const submit = handleSubmit(({ document }) => {
    onSave(document);
    onClose();
  });

  return (
    <Modal isOpen onClose={onClose} title={`Dokument pozycji: ${positionName}`}>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-[11px] text-grayText">
          Wskaż folder lub plik w Dokumentach, np. raport finansowy partnera.
        </p>
        <Controller
          control={control}
          name="document"
          render={({ field }) => (
            <DocumentLinkPicker
              projectId={projectId}
              folderPaths={folderPaths}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button type="submit" variant="primary" size="small">
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
