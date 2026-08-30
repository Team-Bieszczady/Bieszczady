import { useState } from 'react';
import RowActionsMenu from './RowActionsMenu';
import DeleteAccountDialog from './DeleteAccountDialog';
import { useAuth } from '../../../context/useAuth';
import type { Person } from '../data';

interface PersonRowActionsProps {
  person: Person;
}

export default function PersonRowActions({ person }: PersonRowActionsProps) {
  const { user } = useAuth();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  if (person.status === 'DELETED') return null;

  return (
    <>
      <RowActionsMenu
        personId={person.id}
        canDelete={!!user?.isDirector}
        onDelete={() => setIsConfirmOpen(true)}
      />

      <DeleteAccountDialog
        person={person}
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  );
}
