import { failure, type ActionFailure } from '../../../lib/actionResult';
import type { ProjectRoleValue } from '../../../lib/projectsApi';
import {
  useAddMember,
  useAvailableMembers,
  useMembers,
  useRemoveMember,
  useSetMemberRole,
} from './useProjectsApi';

export interface TeamMemberView {
  id: string;
  userId: string;
  name: string;
  role: ProjectRoleValue;
}

export type TeamResult = { ok: true } | ActionFailure;

export function useProjectTeam(projectId: string, canEdit = true) {
  const query = useMembers(projectId);
  const candidatesQuery = useAvailableMembers(projectId, canEdit);
  const addMemberMutation = useAddMember(projectId);
  const updateRole = useSetMemberRole(projectId);
  const removeMemberMutation = useRemoveMember(projectId);

  const team: TeamMemberView[] = (query.data ?? []).map((member) => ({
    id: member.id,
    userId: member.userId,
    name: `${member.user.firstName} ${member.user.lastName}`,
    role: member.projectRole,
  }));

  const candidates = (candidatesQuery.data ?? []).map((user) => ({
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`,
  }));

  const addMember = async (
    userId: string,
    projectRole: ProjectRoleValue,
  ): Promise<TeamResult> => {
    try {
      await addMemberMutation.mutateAsync({ userId, projectRole });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się dodać członka zespołu');
    }
  };

  const changeRole = async (
    id: string,
    projectRole: ProjectRoleValue,
  ): Promise<TeamResult> => {
    try {
      await updateRole.mutateAsync({ id, projectRole });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zmienić roli');
    }
  };

  const removeMember = async (id: string): Promise<TeamResult> => {
    try {
      await removeMemberMutation.mutateAsync(id);
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się usunąć członka zespołu');
    }
  };

  return {
    team,
    candidates,
    isLoading: query.isLoading,
    addMember,
    changeRole,
    removeMember,
  };
}
