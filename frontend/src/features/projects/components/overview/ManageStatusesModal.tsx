import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2 } from 'react-icons/fi';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { InlineEditField } from '../../../../components/ui/InlineEditField';
import { SwatchPicker } from '../../../../components/ui/SwatchPicker';
import {
  STATUS_COLORS,
  getStatusColor,
  type StatusColorId,
} from '../../overviewStatuses';
import { PROJECT_FORMS, pluralizePl } from '../../../../lib/pluralizePl';
import type { DictionaryEntry } from '../../../../lib/projectsApi';
import type { DeleteStatusResult } from '../../hooks/useProjectOverviewEditing';

interface ManageStatusesModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: ReadonlyArray<DictionaryEntry>;
  onRename: (id: string, name: string) => void;
  onRecolor: (id: string, color: StatusColorId) => void;
  onDelete: (id: string) => Promise<DeleteStatusResult>;
}

export default function ManageStatusesModal({
  isOpen,
  onClose,
  statuses,
  onRename,
  onRecolor,
  onDelete,
}: ManageStatusesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swatchId, setSwatchId] = useState<string | null>(null);

  const close = () => {
    setEditingId(null);
    setSwatchId(null);
    onClose();
  };

  const rename = (id: string, name: string) => {
    onRename(id, name);
    setEditingId(null);
  };

  const remove = async (status: DictionaryEntry) => {
    const result = await onDelete(status.id);

    if (result.ok) {
      toast.success(`Status „${status.name}” został usunięty`);
      return;
    }
    
    if (result.usage > 0) {
      const message = `Nie można usunąć statusu — używa go ${pluralizePl(result.usage, PROJECT_FORMS)}. Najpierw przypisz im inny status.`;
      toast.error(message, { id: message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Zarządzaj statusami"
      size="lg"
    >
      <p className="mb-4 text-xs text-grayText">
        Kliknij kolorowe kółko, aby zmienić kolor, lub nazwę, aby ją edytować.
        Statusu używanego przez projekty nie można usunąć.
      </p>

      <ul className="flex flex-col gap-2">
        {statuses.map((status) => {
          const color = getStatusColor(status.color ?? '');

          return (
            <li
              key={status.id}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSwatchId(swatchId === status.id ? null : status.id)
                  }
                  aria-label={`Zmień kolor statusu ${status.name}`}
                  aria-expanded={swatchId === status.id}
                  className={`h-4 w-4 shrink-0 cursor-pointer rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-dark/30 focus-visible:outline-none ${color.dot}`}
                />

                <div className="min-w-0 flex-1 text-sm text-dark">
                  <InlineEditField
                    value={status.name}
                    isEditing={editingId === status.id}
                    onStartEdit={() => setEditingId(status.id)}
                    onCancel={() => setEditingId(null)}
                    onSave={(name) => rename(status.id, name)}
                    canEdit
                    ariaLabel={`Nazwa statusu ${status.name}`}
                    emptyMessage="Nazwa statusu nie może być pusta"
                    inputClassName="text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void remove(status)}
                  aria-label={`Usuń status ${status.name}`}
                  className="shrink-0 cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-darkRed focus-visible:ring-1 focus-visible:ring-darkRed focus-visible:outline-none"
                >
                  <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {swatchId === status.id && (
                <div className="mt-3 border-t border-gray-100 pt-3 pl-7">
                  <SwatchPicker
                    colors={STATUS_COLORS}
                    value={status.color ?? ''}
                    onChange={(next) => {
                      onRecolor(status.id, next as StatusColorId);
                      setSwatchId(null);
                    }}
                    ariaLabel={`Kolor statusu ${status.name}`}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex justify-end border-t border-gray-200 pt-4">
        <Button
          variant="primary"
          size="small"
          type="button"
          onClick={close}
          className="font-medium!"
        >
          Gotowe
        </Button>
      </div>
    </Modal>
  );
}
