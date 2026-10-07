import type { UseFormRegisterReturn } from 'react-hook-form';
import { FIELD_LABEL_CLASSES } from '../../../components/ui/formStyles';
import { useMembers } from '../../projects/hooks/useProjectsApi';

interface InviteeCheckboxesProps {
  projectId: string;
  registration: UseFormRegisterReturn<'inviteeIds'>;
}

export function InviteeCheckboxes({
  projectId,
  registration,
}: InviteeCheckboxesProps) {
  const membersQuery = useMembers(projectId);
  const members = membersQuery.data ?? [];

  return (
    <fieldset>
      <legend className={FIELD_LABEL_CLASSES}>Zaproszeni (opcjonalnie)</legend>

      {membersQuery.isPending && (
        <p className="text-xs text-grayText">Ładowanie zespołu…</p>
      )}
      {membersQuery.isError && (
        <p className="text-xs text-darkRed">Nie udało się pobrać zespołu.</p>
      )}
      {membersQuery.isSuccess && members.length === 0 && (
        <p className="text-xs text-grayText">
          W tym projekcie nie ma jeszcze nikogo.
        </p>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {members.map((member) => (
          <label
            key={member.userId}
            className="flex cursor-pointer items-center gap-2 text-xs text-dark"
          >
            <input
              type="checkbox"
              value={member.userId}
              {...registration}
              className="h-4 w-4 cursor-pointer accent-darkGreen"
            />
            {member.user.firstName} {member.user.lastName}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
