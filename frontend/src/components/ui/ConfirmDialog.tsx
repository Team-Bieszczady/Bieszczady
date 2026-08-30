import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  isPending?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Anuluj',
  tone = 'default',
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <p className="text-sm text-dark/75">{description}</p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="compact"
            onClick={onClose}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={tone === 'danger' ? 'outline' : 'primary'}
            size="compact"
            onClick={onConfirm}
            isPending={isPending}
            className={
              tone === 'danger'
                ? 'text-darkRed border-darkRed hover:border-darkRed hover:bg-red-50'
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
