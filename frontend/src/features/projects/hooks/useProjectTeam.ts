import { failure, type ActionFailure } from '../../../lib/actionResult';
import type { ModuleKey } from '../../../lib/modules';
import type { ProjectRoleValue } from '../../../lib/projectsApi';
import {
  useAddMember,
  useAvailableMembers,
  useBudgetAccess,
  useGrantBudgetAccess,
  useMembers,
  useRemoveMember,
  useRevokeBudgetAccess,
  useSetMemberRole,
} from './useProjectsApi';

export interface TeamMemberView {
  id: string;
  userId: string;
  name: string;
  role: ProjectRoleValue;
  modules: ModuleKey[];
  budgetAccessId: string | null;
}

export interface TeamMemberValues {
  userId: string;
  role: ProjectRoleValue;
  modules: ModuleKey[];
  canEditBudget: boolean;
}

export type TeamResult = { ok: true } | ActionFailure;

export function useProjectTeam(projectId: string, canEdit = true) {
  const query = useMembers(projectId);
  const candidatesQuery = useAvailableMembers(projectId, canEdit);
  const budgetAccessQuery = useBudgetAccess(projectId, canEdit);
  const addMemberMutation = useAddMember(projectId);
  const updateRole = useSetMemberRole(projectId);
  const removeMemberMutation = useRemoveMember(projectId);
  const grantBudget = useGrantBudgetAccess(projectId);
  const revokeBudget = useRevokeBudgetAccess(projectId);

  const grantIdByUser = new Map(
    (budgetAccessQuery.data ?? []).map((grant) => [grant.userId, grant.id]),
  );

  const team: TeamMemberView[] = (query.data ?? []).map((member) => ({
    id: member.id,
    userId: member.userId,
    name: `${member.user.firstName} ${member.user.lastName}`,
    role: member.projectRole,
    modules: member.modules,
    budgetAccessId: grantIdByUser.get(member.userId) ?? null,
  }));

  const candidates = (candidatesQuery.data ?? []).map((user) => ({
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`,
  }));

  const wantsBudgetEdit = (values: TeamMemberValues) =>
    values.role !== 'COORDINATOR' &&
    values.modules.includes('BUDGET') &&
    values.canEditBudget;

  const addMember = async (values: TeamMemberValues): Promise<TeamResult> => {
    try {
      await addMemberMutation.mutateAsync({
        userId: values.userId,
        projectRole: values.role,
        ...(values.role === 'COORDINATOR' ? {} : { modules: values.modules }),
      });
    } catch (error) {
      return failure(error, 'Nie udało się dodać członka zespołu');
    }
    try {
      if (wantsBudgetEdit(values)) await grantBudget.mutateAsync(values.userId);
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się nadać prawa edycji budżetu');
    }
  };

  const updateMember = async (
    member: TeamMemberView,
    values: TeamMemberValues,
  ): Promise<TeamResult> => {
    try {
      await updateRole.mutateAsync({
        id: member.id,
        projectRole: values.role,
        ...(values.role === 'COORDINATOR' ? {} : { modules: values.modules }),
      });
    } catch (error) {
      return failure(error, 'Nie udało się zapisać członka zespołu');
    }
    if (values.role === 'COORDINATOR') return { ok: true };

    try {
      if (wantsBudgetEdit(values) && !member.budgetAccessId) {
        await grantBudget.mutateAsync(member.userId);
      }
      if (
        !values.canEditBudget &&
        values.modules.includes('BUDGET') &&
        member.budgetAccessId
      ) {
        await revokeBudget.mutateAsync(member.budgetAccessId);
      }
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zmienić prawa edycji budżetu');
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
    updateMember,
    removeMember,
  };
}
