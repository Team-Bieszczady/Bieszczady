import { useState } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../../components/ui/ActionMenu';
import { Button } from '../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import type { SelectOption } from '../../../../components/ui/Select';
import { Spinner } from '../../../../components/ui/Spinner';
import type { ProjectRoleValue } from '../../../../lib/projectsApi';
import { PROJECT_ROLE_LABELS } from '../../labels';
import {
  useProjectTeam,
  type TeamMemberView,
} from '../../hooks/useProjectTeam';
import EmptySectionState from './EmptySectionState';
import OverviewSection from './OverviewSection';
import TeamMemberFormModal from './TeamMemberFormModal';

interface TeamSectionProps {
  projectId: string;
  canEdit: boolean;
}

type TeamDialog =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'role'; member: TeamMemberView }
  | { kind: 'remove'; member: TeamMemberView };

const CLOSED: TeamDialog = { kind: 'none' };

export default function TeamSection({
  projectId,
  canEdit,
}: TeamSectionProps) {
  const { team, candidates, isLoading, addMember, changeRole, removeMember } =
    useProjectTeam(projectId, canEdit);
  const [dialog, setDialog] = useState<TeamDialog>(CLOSED);

  const close = () => setDialog(CLOSED);

  const candidateOptions: SelectOption[] = candidates.map((candidate) => ({
    value: candidate.userId,
    label: candidate.name,
  }));

  const submitAdd = async (values: {
    userId: string;
    role: ProjectRoleValue;
  }) => {
    const result = await addMember(values.userId, values.role);
    if (!result.ok) return toast.error(result.message);

    close();
    toast.success('Członek zespołu dodany');
  };

  const submitRole = async (
    member: TeamMemberView,
    values: { role: ProjectRoleValue },
  ) => {
    const result = await changeRole(member.id, values.role);
    if (!result.ok) return toast.error(result.message);

    close();
    toast.success('Rola zaktualizowana');
  };

  const confirmRemove = async (member: TeamMemberView) => {
    const result = await removeMember(member.id);
    if (!result.ok) return toast.error(result.message);

    close();
    toast.success('Członek zespołu usunięty z projektu');
  };

  const menuItems = (member: TeamMemberView): ActionMenuItem[] => [
    {
      id: 'role',
      label: 'Zmień rolę w projekcie',
      onSelect: () => setDialog({ kind: 'role', member }),
    },
    {
      id: 'remove',
      label: 'Usuń z projektu',
      tone: 'danger',
      onSelect: () => setDialog({ kind: 'remove', member }),
    },
  ];

  return (
    <OverviewSection
      number={7}
      title="Zespół"
      titleAside={
        canEdit && (
          <Link
            to="/people"
            className="text-xs font-medium text-darkGreen hover:underline"
          >
            Zobacz wszystkich w Ludzie →
          </Link>
        )
      }
      actions={
        canEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={() => setDialog({ kind: 'add' })}
            className="text-xs max-lg:h-7 max-lg:px-4 max-lg:py-1"
          >
            + Dodaj członka
          </Button>
        )
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : team.length === 0 ? (
        <EmptySectionState
          title="Dodaj członków do projektu"
          hint="Bez zespołu nie ma komu przypisać zadań ani ryzyk."
          canEdit={canEdit}
        />
      ) : (
        <div className="animate-fade-in grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 800:gap-4 xl:grid-cols-4">
          {team.map((member) => (
            <article
              key={member.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-dark">
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-xs text-grayText">
                    {PROJECT_ROLE_LABELS[member.role]}
                  </p>
                </div>
                {canEdit && (
                  <ActionMenu
                    items={menuItems(member)}
                    ariaLabel={`Opcje członka zespołu ${member.name}`}
                    className="-mr-1 shrink-0"
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {dialog.kind === 'add' && (
        <TeamMemberFormModal
          mode="add"
          member={null}
          candidateOptions={candidateOptions}
          onClose={close}
          onSubmit={submitAdd}
        />
      )}

      {dialog.kind === 'role' && (
        <TeamMemberFormModal
          mode="role"
          member={dialog.member}
          candidateOptions={candidateOptions}
          onClose={close}
          onSubmit={(values) => submitRole(dialog.member, values)}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.kind === 'remove'}
        onClose={close}
        onConfirm={() =>
          dialog.kind === 'remove' && confirmRemove(dialog.member)
        }
        title="Usuń z projektu"
        description={
          <>
            {dialog.kind === 'remove' ? dialog.member.name : ''} przestanie być
            członkiem tego projektu. Konto użytkownika pozostaje bez zmian.
          </>
        }
        confirmLabel="Usuń z projektu"
        tone="danger"
      />
    </OverviewSection>
  );
}
