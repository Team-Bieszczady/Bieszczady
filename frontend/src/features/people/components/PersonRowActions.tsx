import { useState } from 'react';
import RowActionsMenu from './RowActionsMenu';
import DeleteAccountDialog from './DeleteAccountDialog';
import ManageModuleAccessModal from './ManageModuleAccessModal';
import { useUserModules } from '../hooks/useUpdateUserModules';
import { useAuth } from '../../../context/useAuth';
import type { Person } from '../data';

interface PersonRowActionsProps {
  person: Person;
}

export default function PersonRowActions({ person }: PersonRowActionsProps) {
  const { user } = useAuth();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isModulesOpen, setIsModulesOpen] = useState(false);
  const canManageModules = !!user?.isDirector && !person.isDirector;
  const modules = useUserModules(person.id, isModulesOpen);

  if (person.status === 'DELETED') return null;

  return (
    <>
      <RowActionsMenu
        personId={person.id}
        canDelete={!!user?.isDirector}
        onDelete={() => setIsConfirmOpen(true)}
        onManageModules={
          canManageModules ? () => setIsModulesOpen(true) : undefined
        }
      />

      <DeleteAccountDialog
        person={person}
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
      />
      {isModulesOpen && modules.data && (
        <ManageModuleAccessModal
          userId={person.id}
          userName={`${person.firstName} ${person.lastName}`.trim()}
          currentModules={modules.data}
          isOpen
          onClose={() => setIsModulesOpen(false)}
        />
      )}
    </>
  );
}
