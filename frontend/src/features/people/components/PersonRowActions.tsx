import { useState } from 'react';
import RowActionsMenu from './RowActionsMenu';
import DeleteAccountDialog from './DeleteAccountDialog';
import { isSelf } from '../utils/peoplePermissions';
import { useAuth } from '../../../context/useAuth';
import type { Person } from '../data';

interface PersonRowActionsProps {
  person: Person;
}

export default function PersonRowActions({ person }: PersonRowActionsProps) {
  const { user } = useAuth();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const canDelete = !!user?.isDirector && !isSelf(user, person.id);

  if (person.status === 'DELETED') return null;

  return (
    <>
      <RowActionsMenu
        personId={person.id}
        canDelete={canDelete}
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
