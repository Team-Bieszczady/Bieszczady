import { request, type AccountStatus } from './api';
import type { ModuleKey } from './modules';

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

export interface PersonRef {
  id: string;
  firstName: string;
  lastName: string;
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
  viewerModules: ModuleKey[];
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
  owner: PersonRef | null;
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
  activity: NamedRef;
  stage: NamedRef & { deadline: string; archivedAt: string | null };
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
  responsible: PersonRef | null;
}

export type IndicatorScopeValue = 'STAGE' | 'PROJECT';

export interface BackendIndicator {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  percent: number;
  scope: IndicatorScopeValue;
  stage: NamedRef | null;
  task: { id: string; title: string } | null;
  deadline: string | null;
  deadlineSource: string;
  owner: PersonRef | null;
  folders: { id: string; name: string; path: string }[];
}

export interface IndicatorPayload {
  name: string;
  description?: string;
  targetValue: number;
  currentValue?: number;
  scope: IndicatorScopeValue;
  stageId?: string | null;
  taskId?: string | null;
  folderIds?: string[];
  ownerId?: string | null;
}

export type ProjectRoleValue = 'COORDINATOR' | 'EXECUTOR' | 'PARTNER';

export interface BackendMemberUser extends PersonRef {
  email: string;
  avatar: string | null;
  accountStatus: AccountStatus;
}

export interface BackendMember {
  id: string;
  projectId: string;
  userId: string;
  projectRole: ProjectRoleValue;
  joinedAt: string;
  user: BackendMemberUser;
  modules: ModuleKey[];
}

export interface BackendBudgetAccess {
  id: string;
  projectId: string;
  userId: string;
}

export interface MemberPayload {
  projectRole: ProjectRoleValue;
  modules?: ModuleKey[];
}

export type PartnerStatusValue = 'ACTIVE' | 'PAUSED';

export interface BackendPartner {
  id: string;
  name: string;
  type: string;
  nip: string;
  city: string;
  email: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  agreement: string;
  agreementValidUntil: string;
  status: PartnerStatusValue;
  projects: NamedRef[];
}

export interface PartnerBody {
  name: string;
  type: string;
  nip: string;
  city: string;
  email: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  agreement: string;
  agreementValidUntil: string | null;
  status: PartnerStatusValue;
  projectIds: string[];
}

export interface BudgetActorRef {
  id: string;
  name: string;
}

export type BudgetDocumentLink =
  | { kind: 'FOLDER'; folderId: string }
  | { kind: 'FILE'; folderId: string; documentId: string; name: string };

export interface BudgetDocumentLinkBody {
  kind: 'FOLDER' | 'FILE';
  folderId: string;
  documentId?: string;
}

export interface BackendBudgetPosition {
  id: string;
  name: string;
  planned: string;
  grant: string;
  ownContribution: string;
}

export interface BackendBudgetCategory {
  id: string;
  name: string;
  partnerId: string | null;
  positions: BackendBudgetPosition[];
}

export type BudgetVersionStatusValue = 'DRAFT' | 'PENDING' | 'APPROVED';
export type BudgetInvoiceStatusValue = 'TO_BE_PAID' | 'PAID';
export type BudgetColumnTypeValue = 'text' | 'money' | 'person';

export interface BackendBudgetVersion {
  id: string;
  number: number;
  name: string;
  status: BudgetVersionStatusValue;
  isCurrent: boolean;
  createdBy: BudgetActorRef | null;
  createdAt: string;
  submittedBy: BudgetActorRef | null;
  submittedAt: string | null;
  approvedBy: BudgetActorRef | null;
  approvedAt: string | null;
  description: string;
  savedAt: string | null;
  rejections: { by: BudgetActorRef | null; at: string; comment: string }[];
  categories: BackendBudgetCategory[];
}

export interface BackendBudgetInvoice {
  id: string;
  number: string;
  amount: string;
  contractor: string;
  date: string;
  grant: string;
  ownContribution: string;
  enteredBy: string;
  status: BudgetInvoiceStatusValue;
  document: BudgetDocumentLink | null;
}

export interface BackendBudgetActuals {
  values: Record<string, string>;
  invoices: BackendBudgetInvoice[];
  status: BudgetInvoiceStatusValue | null;
  document: BudgetDocumentLink | null;
}

export interface BudgetPartnerRef extends NamedRef {
  status: PartnerStatusValue;
}

export interface BudgetPermissions {
  canEdit: boolean;
  canApprove: boolean;
  canManageAccess: boolean;
  partnerId: string | null;
}

export interface BackendBudgetStore {
  columns: {
    id: string;
    name: string;
    type: BudgetColumnTypeValue;
    locked: boolean;
  }[];
  versions: BackendBudgetVersion[];
  actuals: Record<string, BackendBudgetActuals>;
  categorySettings: Record<
    string,
    {
      detailed: boolean;
      partnerCanEdit: boolean;
      visibleToPartner: boolean;
      document: BudgetDocumentLink | null;
    }
  >;
  history: {
    id: string;
    at: string;
    by: BudgetActorRef | null;
    versionId: string;
    versionName: string;
    kind: string;
    comment: string | null;
  }[];
  permissions: BudgetPermissions;
  partners: BudgetPartnerRef[];
}

export interface BudgetInvoicePayload {
  number: string;
  contractor: string;
  date: string;
  amount: string;
  grant?: string;
  ownContribution?: string;
  document?: BudgetDocumentLinkBody | null;
}

export interface BudgetCategorySettingsPayload {
  detailed?: boolean;
  partnerCanEdit?: boolean;
  visibleToPartner?: boolean;
  document?: BudgetDocumentLinkBody | null;
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

function childResource<TRow, TCreate extends object, TPatch extends object>({
  parent,
  resource,
  label,
}: {
  parent: string;
  resource: string;
  label: string;
}) {
  return {
    list: (accessToken: string, parentId: string) =>
      get<TRow[]>(
        accessToken,
        `/${parent}/${parentId}/${resource}`,
        `Nie udało się pobrać: ${label}`,
      ),
    create: (accessToken: string, parentId: string, body: TCreate) =>
      send<TRow>(
        'POST',
        accessToken,
        `/${parent}/${parentId}/${resource}`,
        `Nie udało się dodać: ${label}`,
        body,
      ),
    patch: (accessToken: string, id: string, body: TPatch) =>
      send<TRow>(
        'PATCH',
        accessToken,
        `/${resource}/${id}`,
        `Nie udało się zapisać: ${label}`,
        body,
      ),
    remove: (accessToken: string, id: string) =>
      send<void>(
        'DELETE',
        accessToken,
        `/${resource}/${id}`,
        `Nie udało się usunąć: ${label}`,
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
  archive: (accessToken: string, id: string) =>
    send<BackendProject>(
      'PATCH',
      accessToken,
      `/projects/${id}/archive`,
      'Nie udało się zarchiwizować projektu',
    ),
  restore: (accessToken: string, id: string) =>
    send<BackendProject>(
      'PATCH',
      accessToken,
      `/projects/${id}/restore`,
      'Nie udało się przywrócić projektu',
    ),
  remove: (accessToken: string, id: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/projects/${id}`,
      'Nie udało się usunąć projektu',
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
>({ parent: 'projects', resource: 'goals', label: 'cele' });

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
>({ parent: 'projects', resource: 'risks', label: 'ryzyka' });

export const indicatorsApi = {
  ...childResource<BackendIndicator, IndicatorPayload, IndicatorPayload>({
    parent: 'projects',
    resource: 'indicators',
    label: 'wskaźniki',
  }),
  progress: (
    accessToken: string,
    id: string,
    body: { delta: 1 | -1 } | { value: number },
  ) =>
    send<BackendIndicator>(
      'PATCH',
      accessToken,
      `/indicators/${id}/progress`,
      'Nie udało się zmienić postępu wskaźnika',
      body,
    ),
};

export const membersApi = {
  ...childResource<
    BackendMember,
    MemberPayload & { userId: string },
    MemberPayload
  >({ parent: 'projects', resource: 'members', label: 'zespół' }),
  available: (accessToken: string, projectId: string) =>
    get<BackendMemberUser[]>(
      accessToken,
      `/projects/${projectId}/available-members`,
      'Nie udało się pobrać dostępnych osób',
    ),
};

export const budgetAccessApi = {
  list: (accessToken: string, projectId: string) =>
    get<BackendBudgetAccess[]>(
      accessToken,
      `/projects/${projectId}/budget/access`,
      'Nie udało się pobrać dostępu do budżetu',
    ),
  grant: (accessToken: string, projectId: string, userId: string) =>
    send<BackendBudgetAccess>(
      'POST',
      accessToken,
      `/projects/${projectId}/budget/access`,
      'Nie udało się nadać prawa edycji budżetu',
      { userId },
    ),
  revoke: (accessToken: string, id: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/budget-access/${id}`,
      'Nie udało się odebrać prawa edycji budżetu',
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
  >({ parent: 'projects', resource: 'stages', label: 'etapy' }),

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
>({ parent: 'tasks', resource: 'subtasks', label: 'podzadania' });

export const partnersApi = {
  list: (accessToken: string) =>
    get<BackendPartner[]>(
      accessToken,
      '/partners',
      'Nie udało się pobrać partnerów',
    ),

  create: (accessToken: string, body: PartnerBody) =>
    send<BackendPartner>(
      'POST',
      accessToken,
      '/partners',
      'Nie udało się dodać partnera',
      body,
    ),

  patch: (accessToken: string, id: string, body: PartnerBody) =>
    send<BackendPartner>(
      'PATCH',
      accessToken,
      `/partners/${id}`,
      'Nie udało się zapisać partnera',
      body,
    ),

  remove: (accessToken: string, id: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/partners/${id}`,
      'Nie udało się usunąć partnera',
    ),
};

export const budgetApi = {
  get: (accessToken: string, projectId: string) =>
    get<BackendBudgetStore>(
      accessToken,
      `/projects/${projectId}/budget`,
      'Nie udało się wczytać budżetu',
    ),

  createCategory: (
    accessToken: string,
    versionId: string,
    body: { name: string; partnerId: string | null },
  ) =>
    send<BackendBudgetCategory>(
      'POST',
      accessToken,
      `/budget-versions/${versionId}/categories`,
      'Nie udało się dodać kategorii',
      body,
    ),
  patchCategory: (
    accessToken: string,
    versionId: string,
    key: string,
    body: { name?: string; partnerId?: string | null },
  ) =>
    send<BackendBudgetCategory>(
      'PATCH',
      accessToken,
      `/budget-versions/${versionId}/categories/${key}`,
      'Nie udało się zapisać kategorii',
      body,
    ),
  removeCategory: (accessToken: string, versionId: string, key: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/budget-versions/${versionId}/categories/${key}`,
      'Nie udało się usunąć kategorii',
    ),

  createPosition: (
    accessToken: string,
    versionId: string,
    categoryKey: string,
    body: { name?: string },
  ) =>
    send<BackendBudgetPosition>(
      'POST',
      accessToken,
      `/budget-versions/${versionId}/categories/${categoryKey}/positions`,
      'Nie udało się dodać pozycji',
      body,
    ),
  patchPosition: (
    accessToken: string,
    versionId: string,
    key: string,
    body: {
      name?: string;
      planned?: string;
      grant?: string;
      ownContribution?: string;
    },
  ) =>
    send<BackendBudgetPosition>(
      'PATCH',
      accessToken,
      `/budget-versions/${versionId}/positions/${key}`,
      'Nie udało się zapisać pozycji',
      body,
    ),
  removePosition: (accessToken: string, versionId: string, key: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/budget-versions/${versionId}/positions/${key}`,
      'Nie udało się usunąć pozycji',
    ),

  createColumn: (
    accessToken: string,
    projectId: string,
    body: { name: string; type: BudgetColumnTypeValue },
  ) =>
    send<BackendBudgetStore['columns'][number]>(
      'POST',
      accessToken,
      `/projects/${projectId}/budget/columns`,
      'Nie udało się dodać kolumny',
      body,
    ),
  renameColumn: (
    accessToken: string,
    projectId: string,
    key: string,
    name: string,
  ) =>
    send<BackendBudgetStore['columns'][number]>(
      'PATCH',
      accessToken,
      `/projects/${projectId}/budget/columns/${key}`,
      'Nie udało się zmienić nazwy kolumny',
      { name },
    ),
  removeColumn: (accessToken: string, projectId: string, key: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/projects/${projectId}/budget/columns/${key}`,
      'Nie udało się usunąć kolumny',
    ),

  patchCategorySettings: (
    accessToken: string,
    projectId: string,
    categoryKey: string,
    body: BudgetCategorySettingsPayload,
  ) =>
    send<unknown>(
      'PATCH',
      accessToken,
      `/projects/${projectId}/budget/category-settings/${categoryKey}`,
      'Nie udało się zapisać ustawień kategorii',
      body,
    ),

  setCell: (
    accessToken: string,
    projectId: string,
    positionKey: string,
    columnKey: string,
    value: string,
  ) =>
    send<void>(
      'PATCH',
      accessToken,
      `/projects/${projectId}/budget/actuals/${positionKey}/values/${columnKey}`,
      'Nie udało się zapisać wartości',
      { value },
    ),
  patchActual: (
    accessToken: string,
    projectId: string,
    positionKey: string,
    body: {
      status?: BudgetInvoiceStatusValue | null;
      document?: BudgetDocumentLinkBody | null;
    },
  ) =>
    send<void>(
      'PATCH',
      accessToken,
      `/projects/${projectId}/budget/actuals/${positionKey}`,
      'Nie udało się zapisać pozycji',
      body,
    ),
  moveActuals: (
    accessToken: string,
    projectId: string,
    body: { fromPositionKey: string; toPositionKey: string },
  ) =>
    send<void>(
      'POST',
      accessToken,
      `/projects/${projectId}/budget/actuals/move`,
      'Nie udało się przenieść wydatków',
      body,
    ),
  addInvoice: (
    accessToken: string,
    projectId: string,
    positionKey: string,
    body: BudgetInvoicePayload,
  ) =>
    send<unknown>(
      'POST',
      accessToken,
      `/projects/${projectId}/budget/actuals/${positionKey}/invoices`,
      'Nie udało się dodać faktury',
      body,
    ),
  recalculate: (accessToken: string, projectId: string, positionKey: string) =>
    send<void>(
      'POST',
      accessToken,
      `/projects/${projectId}/budget/actuals/${positionKey}/recalculate`,
      'Nie udało się przeliczyć wydatków',
    ),
  setInvoiceStatus: (
    accessToken: string,
    id: string,
    status: BudgetInvoiceStatusValue,
  ) =>
    send<void>(
      'PATCH',
      accessToken,
      `/budget-invoices/${id}`,
      'Nie udało się zmienić statusu faktury',
      { status },
    ),
  removeInvoice: (accessToken: string, id: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/budget-invoices/${id}`,
      'Nie udało się usunąć faktury',
    ),

  createAnnex: (accessToken: string, projectId: string) =>
    send<{ id: string; number: number; name: string }>(
      'POST',
      accessToken,
      `/projects/${projectId}/budget/annexes`,
      'Nie udało się utworzyć aneksu',
    ),
  submit: (accessToken: string, versionId: string) =>
    send<void>(
      'POST',
      accessToken,
      `/budget-versions/${versionId}/submit`,
      'Nie udało się wysłać do akceptacji',
    ),
  withdraw: (accessToken: string, versionId: string) =>
    send<void>(
      'POST',
      accessToken,
      `/budget-versions/${versionId}/withdraw`,
      'Nie udało się wycofać prośby o akceptację',
    ),
  approve: (accessToken: string, versionId: string, description: string) =>
    send<void>(
      'POST',
      accessToken,
      `/budget-versions/${versionId}/approve`,
      'Nie udało się zatwierdzić wersji',
      { description },
    ),
  reject: (accessToken: string, versionId: string, comment: string) =>
    send<void>(
      'POST',
      accessToken,
      `/budget-versions/${versionId}/reject`,
      'Nie udało się odrzucić wersji',
      { comment },
    ),
  revert: (accessToken: string, versionId: string, reason: string) =>
    send<void>(
      'POST',
      accessToken,
      `/budget-versions/${versionId}/revert`,
      'Nie udało się cofnąć zatwierdzenia',
      { reason },
    ),
  editDescription: (
    accessToken: string,
    versionId: string,
    description: string,
  ) =>
    send<void>(
      'PATCH',
      accessToken,
      `/budget-versions/${versionId}`,
      'Nie udało się zapisać opisu',
      { description },
    ),
  discard: (accessToken: string, versionId: string) =>
    send<void>(
      'DELETE',
      accessToken,
      `/budget-versions/${versionId}`,
      'Nie udało się odrzucić wersji roboczej',
    ),
};
