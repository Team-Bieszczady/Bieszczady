import { request } from './api';

const BASE = '/api/v1';

export interface DictionaryEntry {
  id: string;
  name: string;
  active: boolean;
  color?: string;
}

export interface NamedRef {
  id: string;
  name: string;
}

export interface BackendProject {
  id: string;
  name: string;
  description: string;
  color: string;
  budgetAmount: string | null;
  startDate: string | null;
  plannedEndDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: (NamedRef & { color: string }) | null;
  types: NamedRef[];
  recipients: NamedRef[];
}

export interface BackendProjectCard extends BackendProject {
  peopleCount: number;
  progress: number;
  taskCounts: { total: number; done: number; mine: number };
  viewerManages: boolean;
  stageCount: number;
  stageLabel: string;
  daysLeft: number | null;
}

export type TaskStatusValue = 'NEW' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type TaskPriorityValue = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BackendTask {
  id: string;
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueDate: string | null;
  owner: { id: string; firstName: string; lastName: string } | null;
}

export interface BackendSubtask {
  id: string;
  title: string;
  done: boolean;
  sortOrder: number;
}

export interface BackendTaskRow extends BackendTask {
  activityId: string;
  projectId: string;
  description: string;
  activity: { id: string; name: string };
  stage: {
    id: string;
    name: string;
    deadline: string;
    archivedAt: string | null;
  };
  subtaskProgress: { done: number; total: number; percent: number };
  subtasks: BackendSubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatusValue;
  priority?: TaskPriorityValue;
  dueDate?: string | null;
  ownerId?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriorityValue;
  dueDate?: string | null;
  ownerId?: string | null;
  activityId?: string;
}

export interface BackendActivity {
  id: string;
  name: string;
  sortOrder: number;
  taskCount: number;
  tasks: BackendTask[];
}

export interface BackendStage {
  id: string;
  projectId: string;
  name: string;
  description: string;
  sortOrder: number;
  startDate: string | null;
  deadline: string;
  originalDeadline: string | null;
  deadlineNote: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  counts: { total: number; done: number; pending: number };
  activities: BackendActivity[];
}

export interface StageShiftSuggestion {
  stageId: string;
  name: string;
  currentDeadline: string;
  suggestedDeadline: string;
}

export interface BackendGoal {
  id: string;
  projectId: string;
  goalNumber: number;
  title: string;
  description: string;
}

export type RiskLevelValue = 'HIGH' | 'MEDIUM' | 'LOW';

export interface BackendRisk {
  id: string;
  projectId: string;
  description: string;
  probability: RiskLevelValue;
  impact: RiskLevelValue;
  responsibleUserId: string | null;
  responsible: { id: string; firstName: string; lastName: string } | null;
}

export type ProjectRoleValue = 'COORDINATOR' | 'EXECUTOR' | 'PARTNER';

export interface BackendMemberUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  accountStatus: string;
}

export interface BackendMember {
  id: string;
  projectId: string;
  userId: string;
  projectRole: ProjectRoleValue;
  joinedAt: string;
  user: BackendMemberUser;
}

const get = <T>(accessToken: string, path: string, fallbackMessage: string) =>
  request<T>(`${BASE}${path}`, { method: 'GET', accessToken, fallbackMessage });

const send = <T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  accessToken: string,
  path: string,
  fallbackMessage: string,
  body?: object,
) =>
  request<T>(`${BASE}${path}`, { method, accessToken, body, fallbackMessage });

function childResource<TRow, TCreate extends object, TPatch extends object>(
  parentSegment: string,
  childSegment: string,
  itemSegment: string,
  noun: string,
) {
  return {
    list: (accessToken: string, parentId: string) =>
      get<TRow[]>(
        accessToken,
        `/${parentSegment}/${parentId}/${childSegment}`,
        `Nie udało się pobrać: ${noun}`,
      ),
    create: (accessToken: string, parentId: string, body: TCreate) =>
      send<TRow>(
        'POST',
        accessToken,
        `/${parentSegment}/${parentId}/${childSegment}`,
        `Nie udało się dodać: ${noun}`,
        body,
      ),
    patch: (accessToken: string, id: string, body: TPatch) =>
      send<TRow>(
        'PATCH',
        accessToken,
        `/${itemSegment}/${id}`,
        `Nie udało się zapisać: ${noun}`,
        body,
      ),
    remove: (accessToken: string, id: string) =>
      send<void>(
        'DELETE',
        accessToken,
        `/${itemSegment}/${id}`,
        `Nie udało się usunąć: ${noun}`,
      ),
  };
}

function dictionaryResource(segment: string, noun: string) {
  return {
    list: (accessToken: string) =>
      get<DictionaryEntry[]>(
        accessToken,
        `/${segment}`,
        `Nie udało się pobrać: ${noun}`,
      ),
    create: (accessToken: string, body: { name: string; color?: string }) =>
      send<DictionaryEntry>(
        'POST',
        accessToken,
        `/${segment}`,
        `Nie udało się dodać: ${noun}`,
        body,
      ),
    patch: (
      accessToken: string,
      id: string,
      body: { name?: string; color?: string; active?: boolean },
    ) =>
      send<DictionaryEntry>(
        'PATCH',
        accessToken,
        `/${segment}/${id}`,
        `Nie udało się zapisać: ${noun}`,
        body,
      ),
    remove: (accessToken: string, id: string) =>
      send<void>(
        'DELETE',
        accessToken,
        `/${segment}/${id}`,
        `Nie udało się usunąć: ${noun}`,
      ),
  };
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  statusId?: string;
  color?: string;
  budgetAmount?: string;
  startDate?: string;
  plannedEndDate?: string;
  typeIds?: string[];
  recipientIds?: string[];
  members?: { userId: string; projectRole: ProjectRoleValue }[];
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  color?: string;
  startDate?: string | null;
  plannedEndDate?: string | null;
}

export const projectsApi = {
  list: (accessToken: string, options: { archived?: boolean } = {}) =>
    get<BackendProjectCard[]>(
      accessToken,
      `/projects${options.archived ? '?archived=true' : ''}`,
      'Nie udało się pobrać listy projektów',
    ),
  get: (accessToken: string, id: string) =>
    get<BackendProject>(
      accessToken,
      `/projects/${id}`,
      'Nie udało się pobrać projektu',
    ),
  create: (accessToken: string, body: CreateProjectPayload) =>
    send<BackendProject>(
      'POST',
      accessToken,
      '/projects',
      'Nie udało się utworzyć projektu',
      body,
    ),
  patch: (accessToken: string, id: string, body: UpdateProjectPayload) =>
    send<BackendProject>(
      'PATCH',
      accessToken,
      `/projects/${id}`,
      'Nie udało się zapisać projektu',
      body,
    ),
  setStatus: (accessToken: string, id: string, statusId: string | null) =>
    send<BackendProject>(
      'PATCH',
      accessToken,
      `/projects/${id}/status`,
      'Nie udało się zmienić statusu projektu',
      { statusId },
    ),
  setTypes: (accessToken: string, id: string, typeIds: string[]) =>
    send<BackendProject>(
      'PATCH',
      accessToken,
      `/projects/${id}/types`,
      'Nie udało się zapisać typów projektu',
      { typeIds },
    ),
  setRecipients: (accessToken: string, id: string, recipientIds: string[]) =>
    send<BackendProject>(
      'PATCH',
      accessToken,
      `/projects/${id}/recipients`,
      'Nie udało się zapisać odbiorców projektu',
      { recipientIds },
    ),
};

export const statusesApi = dictionaryResource('project-statuses', 'statusy');
export const typesApi = dictionaryResource('project-types', 'typy');
export const recipientsApi = dictionaryResource(
  'project-recipients',
  'odbiorcy',
);

export const goalsApi = childResource<
  BackendGoal,
  { title: string; description?: string },
  { title?: string; description?: string }
>('projects', 'goals', 'goals', 'cele');

export const risksApi = childResource<
  BackendRisk,
  {
    description: string;
    probability?: RiskLevelValue;
    impact?: RiskLevelValue;
    responsibleUserId?: string | null;
  },
  {
    description?: string;
    probability?: RiskLevelValue;
    impact?: RiskLevelValue;
    responsibleUserId?: string | null;
  }
>('projects', 'risks', 'risks', 'ryzyka');

export const membersApi = {
  ...childResource<
    BackendMember,
    { userId: string; projectRole: ProjectRoleValue },
    { projectRole: ProjectRoleValue }
  >('projects', 'members', 'members', 'zespół'),
  available: (accessToken: string, projectId: string) =>
    get<BackendMemberUser[]>(
      accessToken,
      `/projects/${projectId}/available-members`,
      'Nie udało się pobrać dostępnych osób',
    ),
};

export type StageDeleteStrategy = 'none' | 'move' | 'delete';

export const stagesApi = {
  ...childResource<
    BackendStage,
    {
      name: string;
      description?: string;
      startDate?: string;
      deadline: string;
    },
    { name?: string; description?: string }
  >('projects', 'stages', 'stages', 'etapy'),

  list: (
    accessToken: string,
    projectId: string,
    options: { archived?: boolean } = {},
  ) =>
    get<BackendStage[]>(
      accessToken,
      `/projects/${projectId}/stages${options.archived ? '?archived=true' : ''}`,
      'Nie udało się pobrać etapów',
    ),

  moveDeadline: (
    accessToken: string,
    id: string,
    body: { deadline: string; note?: string },
  ) =>
    send<{ stage: BackendStage; suggestions: StageShiftSuggestion[] }>(
      'PATCH',
      accessToken,
      `/stages/${id}/deadline`,
      'Nie udało się przesunąć terminu',
      body,
    ),

  shiftFollowing: (
    accessToken: string,
    body: { shifts: { stageId: string; deadline: string }[]; note?: string },
  ) =>
    send<BackendStage[]>(
      'POST',
      accessToken,
      '/stages/cascade',
      'Nie udało się przesunąć kolejnych etapów',
      body,
    ),

  archive: (accessToken: string, id: string) =>
    send<BackendStage>(
      'PATCH',
      accessToken,
      `/stages/${id}/archive`,
      'Nie udało się zarchiwizować etapu',
    ),
  restore: (accessToken: string, id: string) =>
    send<BackendStage>(
      'PATCH',
      accessToken,
      `/stages/${id}/restore`,
      'Nie udało się przywrócić etapu',
    ),

  remove: (
    accessToken: string,
    id: string,
    options: { strategy?: StageDeleteStrategy; targetStageId?: string } = {},
  ) => {
    const params = new URLSearchParams();
    if (options.strategy) params.set('strategy', options.strategy);
    if (options.targetStageId)
      params.set('targetStageId', options.targetStageId);
    const query = params.toString();

    return send<void>(
      'DELETE',
      accessToken,
      `/stages/${id}${query ? `?${query}` : ''}`,
      'Nie udało się usunąć etapu',
    );
  },
};

export const activitiesApi = {
  create: (accessToken: string, stageId: string, body: { name: string }) =>
    send<BackendActivity>(
      'POST',
      accessToken,
      `/stages/${stageId}/activities`,
      'Nie udało się dodać działania',
      body,
    ),
  patch: (accessToken: string, id: string, body: { name: string }) =>
    send<BackendActivity>(
      'PATCH',
      accessToken,
      `/activities/${id}`,
      'Nie udało się zapisać działania',
      body,
    ),
  moveToStage: (accessToken: string, id: string, stageId: string) =>
    send<BackendActivity>(
      'PATCH',
      accessToken,
      `/activities/${id}/stage`,
      'Nie udało się przenieść działania',
      { stageId },
    ),
  remove: (accessToken: string, id: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/activities/${id}`,
      'Nie udało się usunąć działania',
    ),
};

export const tasksApi = {
  list: (
    accessToken: string,
    projectId: string,
    options: { archived?: boolean } = {},
  ) =>
    get<BackendTaskRow[]>(
      accessToken,
      `/projects/${projectId}/tasks${options.archived ? '?archived=true' : ''}`,
      'Nie udało się pobrać zadań',
    ),

  listMine: (
    accessToken: string,
    projectId: string,
    options: { archived?: boolean } = {},
  ) =>
    get<BackendTaskRow[]>(
      accessToken,
      `/projects/${projectId}/my-tasks${options.archived ? '?archived=true' : ''}`,
      'Nie udało się pobrać zadań',
    ),

  create: (accessToken: string, activityId: string, body: CreateTaskPayload) =>
    send<BackendTaskRow>(
      'POST',
      accessToken,
      `/activities/${activityId}/tasks`,
      'Nie udało się dodać zadania',
      body,
    ),

  patch: (accessToken: string, id: string, body: UpdateTaskPayload) =>
    send<BackendTaskRow>(
      'PATCH',
      accessToken,
      `/tasks/${id}`,
      'Nie udało się zapisać zadania',
      body,
    ),

  setStatus: (accessToken: string, id: string, status: TaskStatusValue) =>
    send<BackendTaskRow>(
      'PATCH',
      accessToken,
      `/tasks/${id}/status`,
      'Nie udało się zmienić statusu zadania',
      { status },
    ),

  remove: (accessToken: string, id: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/tasks/${id}`,
      'Nie udało się usunąć zadania',
    ),
};

export const subtasksApi = childResource<
  BackendSubtask,
  { title: string },
  { title?: string; done?: boolean }
>('tasks', 'subtasks', 'subtasks', 'podzadania');
