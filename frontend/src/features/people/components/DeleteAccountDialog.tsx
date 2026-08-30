import toast from 'react-hot-toast';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useDeleteUser } from '../hooks/useDeleteUser';
import { toastAccountError } from '../utils/accountErrorMessage';
import type { Person } from '../data';

interface DeleteAccountDialogProps {
  person: Person;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export default function DeleteAccountDialog({
  person,
  isOpen,
  onClose,
  onDeleted,
}: DeleteAccountDialogProps) {
  const deleteUser = useDeleteUser();
  const fullName = `${person.firstName} ${person.lastName}`;

  const removeAccount = () => {
    deleteUser.mutate(person.id, {
      onSuccess: () => {
        toast.success('Konto zostało usunięte.');
        onClose();
        onDeleted?.();
      },
      onError: toastAccountError,
    });
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={removeAccount}
      title="Usunąć konto?"
      description={`Konto ${fullName} zostanie usunięte z systemu. Tej operacji nie można cofnąć.`}
      confirmLabel="Usuń konto"
      tone="danger"
      isPending={deleteUser.isPending}
    />
  );
}
