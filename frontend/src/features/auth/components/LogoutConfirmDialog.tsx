import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Wylogować się?"
      description="Zostaniesz wylogowany i wrócisz do ekranu logowania."
      confirmLabel="Wyloguj się"
      tone="danger"
    />
  );
}
