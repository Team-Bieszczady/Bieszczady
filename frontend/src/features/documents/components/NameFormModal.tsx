import { useState, type ReactNode } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';

interface Props {
  isOpen: boolean;
  title: string;
  label: string;
  hint?: ReactNode;
  initialName: string;
  maxLength: number;
  isPending: boolean;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function NameFormModal({
  isOpen,
  title,
  label,
  hint,
  initialName,
  maxLength,
  isPending,
  onSubmit,
  onClose,
}: Props) {
  const [name, setName] = useState(initialName);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed === '') {
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-5">
        {hint && <p className="text-xs text-gray-400">{hint}</p>}

        <div>
          <label className={FIELD_LABEL_CLASSES}>
            {label} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Podaj nazwę..."
            maxLength={maxLength}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT_CLASSES}
          />
        </div>

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
            onClick={submit}
            disabled={name.trim() === ''}
            isPending={isPending}
            className="font-medium!"
          >
            Zapisz
          </Button>
        </div>
      </div>
    </Modal>
  );
}
