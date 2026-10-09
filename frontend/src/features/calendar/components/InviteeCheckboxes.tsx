import { useEffect } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { LuCheck } from 'react-icons/lu';
import { useMembers } from '../../projects/hooks/useProjectsApi';

interface InviteeCheckboxesProps {
  projectId: string;
  registration: UseFormRegisterReturn<'inviteeIds'>;
  onTeamLoaded?: (memberIds: string[]) => void;
}

const PILL_CLASSES =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-dark transition-colors select-none hover:border-darkGreen has-checked:border-darkGreen has-checked:bg-darkGreen has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-darkGreen/40';

export function InviteeCheckboxes({
  projectId,
  registration,
  onTeamLoaded,
}: InviteeCheckboxesProps) {
  const membersQuery = useMembers(projectId);
  const members = membersQuery.data ?? [];

  useEffect(() => {
    if (onTeamLoaded && membersQuery.data) {
      onTeamLoaded(membersQuery.data.map((member) => member.userId));
    }
  }, [membersQuery.data, onTeamLoaded]);

  if (membersQuery.isPending) {
    return <p className="text-xs text-grayText">Ładowanie zespołu…</p>;
  }

  if (membersQuery.isError) {
    return (
      <p className="text-xs text-darkRed">Nie udało się pobrać zespołu.</p>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-xs text-grayText">
        W tym projekcie nie ma jeszcze nikogo.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((member) => (
        <label key={member.userId} className={PILL_CLASSES}>
          <input
            type="checkbox"
            value={member.userId}
            {...registration}
            className="peer sr-only"
          />
          <LuCheck size={12} className="hidden peer-checked:inline" />
          {member.user.firstName} {member.user.lastName}
        </label>
      ))}
    </div>
  );
}
