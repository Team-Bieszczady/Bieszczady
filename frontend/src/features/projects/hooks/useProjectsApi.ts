import { useApiMutation } from '../../../hooks/useApiMutation';
import { useApiQuery } from '../../../hooks/useApiQuery';
import {
  activitiesApi,
  goalsApi,
  membersApi,
  projectsApi,
  recipientsApi,
  risksApi,
  stagesApi,
  statusesApi,
  typesApi,
  type CreateProjectPayload,
  type ProjectRoleValue,
  type UpdateProjectPayload,
  type RiskLevelValue,
  type StageDeleteStrategy,
} from '../../../lib/projectsApi';

export const projectKeys = {
  list: (archived: boolean) => ['projects', { archived }] as const,
  detail: (id: string) => ['project', id] as const,
  statuses: ['project-statuses'] as const,
  types: ['project-types'] as const,
  recipients: ['project-recipients'] as const,
  goals: (projectId: string) => ['goals', projectId] as const,
  risks: (projectId: string) => ['risks', projectId] as const,
  members: (projectId: string) => ['members', projectId] as const,
  availableMembers: (projectId: string) =>
    ['available-members', projectId] as const,
  stages: (projectId: string, archived: boolean) =>
    ['stages', projectId, { archived }] as const,
  stagesFor: (projectId: string) => ['stages', projectId] as const,
};

export const projectLists = [['projects'], ['project']];

export function useProjects(archived = false, enabled = true) {
  return useApiQuery(
    projectKeys.list(archived),
    (token) => projectsApi.list(token, { archived }),
    { enabled },
  );
}

/**
 * `archived: true` asks the API to INCLUDE archived projects, not to return only
 * those — the Archiwum page wants only those, so it narrows the result here.
 */
export function useArchivedProjects(enabled = true) {
  const query = useProjects(true, enabled);
  return {
    ...query,
    data: query.data?.filter((project) => project.archivedAt !== null),
  };
}

export function useProject(id: string | null) {
  return useApiQuery(
    projectKeys.detail(id ?? ''),
    (token) => projectsApi.get(token, id as string),
    { enabled: !!id },
  );
}

export function useProjectStatuses() {
  return useApiQuery(projectKeys.statuses, statusesApi.list);
}

export function useProjectTypes() {
  return useApiQuery(projectKeys.types, typesApi.list);
}

export function useProjectRecipients() {
  return useApiQuery(projectKeys.recipients, recipientsApi.list);
}

export function useGoals(projectId: string) {
  return useApiQuery(projectKeys.goals(projectId), (token) =>
    goalsApi.list(token, projectId),
  );
}

export function useRisks(projectId: string) {
  return useApiQuery(projectKeys.risks(projectId), (token) =>
    risksApi.list(token, projectId),
  );
}

export function useMembers(projectId: string) {
  return useApiQuery(projectKeys.members(projectId), (token) =>
    membersApi.list(token, projectId),
  );
}

export function useAvailableMembers(projectId: string, enabled = true) {
  return useApiQuery(
    projectKeys.availableMembers(projectId),
    (token) => membersApi.available(token, projectId),
    { enabled },
  );
}

export function useStages(projectId: string, archived = false) {
  return useApiQuery(projectKeys.stages(projectId, archived), (token) =>
    stagesApi.list(token, projectId, { archived }),
  );
}

export function useCreateProject() {
  return useApiMutation(
    (token, payload: CreateProjectPayload) =>
      projectsApi.create(token, payload),
    { invalidates: projectLists },
  );
}

export function useUpdateProject(id: string) {
  return useApiMutation(
    (token, body: UpdateProjectPayload) => projectsApi.patch(token, id, body),
    { invalidates: projectLists },
  );
}

export function useSetProjectStatus(id: string) {
  return useApiMutation(
    (token, statusId: string | null) =>
      projectsApi.setStatus(token, id, statusId),
    { invalidates: projectLists },
  );
}

export function useSetProjectTypes(id: string) {
  return useApiMutation(
    (token, typeIds: string[]) => projectsApi.setTypes(token, id, typeIds),
    { invalidates: projectLists },
  );
}

export function useSetProjectRecipients(id: string) {
  return useApiMutation(
    (token, recipientIds: string[]) =>
      projectsApi.setRecipients(token, id, recipientIds),
    { invalidates: projectLists },
  );
}

export function useArchiveProject() {
  return useApiMutation((token, id: string) => projectsApi.archive(token, id), {
    invalidates: projectLists,
  });
}

export function useRestoreProject() {
  return useApiMutation((token, id: string) => projectsApi.restore(token, id), {
    invalidates: projectLists,
  });
}

/**
 * The API refuses to delete a project that has not been archived, so "Usuń" on a
 * live project archives it first. From Archiwum it is already archived and the
 * delete goes straight through.
 */
export function useDeleteProject() {
  return useApiMutation(
    async (token, project: { id: string; archivedAt: string | null }) => {
      if (!project.archivedAt) await projectsApi.archive(token, project.id);
      await projectsApi.remove(token, project.id);
    },
    { invalidates: projectLists },
  );
}

function dictionaryMutations(
  api: typeof statusesApi,
  queryKey: readonly string[],
) {
  const invalidates = [queryKey, ...projectLists];

  return {
    useCreate: () =>
      useApiMutation(
        (token, body: { name: string; color?: string }) =>
          api.create(token, body),
        { invalidates },
      ),
    useUpdate: () =>
      useApiMutation(
        (
          token,
          {
            id,
            ...body
          }: { id: string; name?: string; color?: string; active?: boolean },
        ) => api.patch(token, id, body),
        { invalidates },
      ),
    useDelete: () =>
      useApiMutation((token, id: string) => api.remove(token, id), {
        invalidates,
      }),
  };
}

export const statusMutations = dictionaryMutations(
  statusesApi,
  projectKeys.statuses,
);
export const typeMutations = dictionaryMutations(typesApi, projectKeys.types);
export const recipientMutations = dictionaryMutations(
  recipientsApi,
  projectKeys.recipients,
);

export function useCreateGoal(projectId: string) {
  return useApiMutation(
    (token, body: { title: string; description?: string }) =>
      goalsApi.create(token, projectId, body),
    { invalidates: [projectKeys.goals(projectId)] },
  );
}

export function useUpdateGoal(projectId: string) {
  return useApiMutation(
    (
      token,
      { id, ...body }: { id: string; title?: string; description?: string },
    ) => goalsApi.patch(token, id, body),
    { invalidates: [projectKeys.goals(projectId)] },
  );
}

export function useDeleteGoal(projectId: string) {
  return useApiMutation((token, id: string) => goalsApi.remove(token, id), {
    invalidates: [projectKeys.goals(projectId)],
  });
}

export interface RiskInput {
  description: string;
  probability?: RiskLevelValue;
  impact?: RiskLevelValue;
  responsibleUserId?: string | null;
}

export function useCreateRisk(projectId: string) {
  return useApiMutation(
    (token, body: RiskInput) => risksApi.create(token, projectId, body),
    { invalidates: [projectKeys.risks(projectId)] },
  );
}

export function useUpdateRisk(projectId: string) {
  return useApiMutation(
    (token, { id, ...body }: RiskInput & { id: string }) =>
      risksApi.patch(token, id, body),
    { invalidates: [projectKeys.risks(projectId)] },
  );
}

export function useDeleteRisk(projectId: string) {
  return useApiMutation((token, id: string) => risksApi.remove(token, id), {
    invalidates: [projectKeys.risks(projectId)],
  });
}

function memberKeys(projectId: string) {
  return [
    projectKeys.members(projectId),
    projectKeys.availableMembers(projectId),
    ...projectLists,
  ];
}

export function useAddMember(projectId: string) {
  return useApiMutation(
    (token, body: { userId: string; projectRole: ProjectRoleValue }) =>
      membersApi.create(token, projectId, body),
    { invalidates: memberKeys(projectId) },
  );
}

export function useAddMemberToProject() {
  return useApiMutation(
    (
      token,
      variables: {
        projectId: string;
        userId: string;
        projectRole: ProjectRoleValue;
      },
    ) =>
      membersApi.create(token, variables.projectId, {
        userId: variables.userId,
        projectRole: variables.projectRole,
      }),
    { invalidates: [['members'], ['available-members'], ...projectLists] },
  );
}

export function useSetMemberRole(projectId: string) {
  return useApiMutation(
    (
      token,
      { id, projectRole }: { id: string; projectRole: ProjectRoleValue },
    ) => membersApi.patch(token, id, { projectRole }),
    { invalidates: memberKeys(projectId) },
  );
}

export function useRemoveMember(projectId: string) {
  return useApiMutation((token, id: string) => membersApi.remove(token, id), {
    invalidates: [...memberKeys(projectId), projectKeys.risks(projectId)],
  });
}

function stageKeys(projectId: string) {
  return [projectKeys.stagesFor(projectId), ...projectLists];
}

export function useCreateStage(projectId: string) {
  return useApiMutation(
    (
      token,
      body: {
        name: string;
        description?: string;
        startDate?: string;
        deadline: string;
      },
    ) => stagesApi.create(token, projectId, body),
    { invalidates: stageKeys(projectId) },
  );
}

export function useUpdateStage(projectId: string) {
  return useApiMutation(
    (
      token,
      { id, ...body }: { id: string; name?: string; description?: string },
    ) => stagesApi.patch(token, id, body),
    { invalidates: stageKeys(projectId) },
  );
}

export function useMoveStageDeadline(projectId: string) {
  return useApiMutation(
    (token, { id, ...body }: { id: string; deadline: string; note?: string }) =>
      stagesApi.moveDeadline(token, id, body),
    { invalidates: stageKeys(projectId) },
  );
}

export function useShiftFollowingStages(projectId: string) {
  return useApiMutation(
    (
      token,
      body: { shifts: { stageId: string; deadline: string }[]; note?: string },
    ) => stagesApi.shiftFollowing(token, body),
    { invalidates: stageKeys(projectId) },
  );
}

export function useArchiveStage(projectId: string) {
  return useApiMutation(
    (token, { id, archived }: { id: string; archived: boolean }) =>
      archived ? stagesApi.archive(token, id) : stagesApi.restore(token, id),
    { invalidates: stageKeys(projectId) },
  );
}

export function useDeleteStage(projectId: string) {
  return useApiMutation(
    (
      token,
      {
        id,
        ...options
      }: {
        id: string;
        strategy?: StageDeleteStrategy;
        targetStageId?: string;
      },
    ) => stagesApi.remove(token, id, options),
    { invalidates: stageKeys(projectId) },
  );
}

export function useCreateActivity(projectId: string) {
  return useApiMutation(
    (token, { stageId, name }: { stageId: string; name: string }) =>
      activitiesApi.create(token, stageId, { name }),
    { invalidates: stageKeys(projectId) },
  );
}

export function useUpdateActivity(projectId: string) {
  return useApiMutation(
    (token, { id, name }: { id: string; name: string }) =>
      activitiesApi.patch(token, id, { name }),
    { invalidates: stageKeys(projectId) },
  );
}

export function useMoveActivity(projectId: string) {
  return useApiMutation(
    (token, { id, stageId }: { id: string; stageId: string }) =>
      activitiesApi.moveToStage(token, id, stageId),
    { invalidates: stageKeys(projectId) },
  );
}

export function useDeleteActivity(projectId: string) {
  return useApiMutation(
    (token, id: string) => activitiesApi.remove(token, id),
    { invalidates: stageKeys(projectId) },
  );
}
