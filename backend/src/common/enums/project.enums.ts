export const PROJECT_ROLES = ['COORDINATOR', 'EXECUTOR', 'PARTNER'] as const;
export type ProjectRoleValue = (typeof PROJECT_ROLES)[number];
export const RISK_LEVELS = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const STATUS_COLORS = [
  'green',
  'blue',
  'amber',
  'red',
  'violet',
  'gray',
] as const;
export type StatusColor = (typeof STATUS_COLORS)[number];

export const PROJECT_COLORS = [
  'green',
  'blue',
  'fuchsia',
  'red',
  'orange',
  'yellow',
] as const;
export type ProjectColor = (typeof PROJECT_COLORS)[number];

export const TASK_STATUSES = ['NEW', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'Nowe',
  IN_PROGRESS: 'W toku',
  BLOCKED: 'Zablokowane',
  DONE: 'Zrobione',
};

export const TASK_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const STAGE_DELETE_STRATEGIES = ['none', 'move', 'delete'] as const;
export type StageDeleteStrategy = (typeof STAGE_DELETE_STRATEGIES)[number];
export const EVENT_SOURCES = ['AUTOMATIC', 'MANUAL'] as const;
export type EventSource = (typeof EVENT_SOURCES)[number];
export const NOTIFICATION_KINDS = [
  'TASK_ASSIGNED',
  'TASK_DUE_SOON',
  'TASK_OVERDUE',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];
export const DEADLINE_NOTIFICATION_KINDS = [
  'TASK_DUE_SOON',
  'TASK_OVERDUE',
] as const satisfies readonly NotificationKind[];

export const INDICATOR_SCOPES = ['STAGE', 'PROJECT'] as const;
export type IndicatorScope = (typeof INDICATOR_SCOPES)[number];

export const PARTNER_STATUSES = ['ACTIVE', 'PAUSED'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

export const PARTNER_TYPES = [
  'Fundacja',
  'Stowarzyszenie',
  'Samorząd',
  'Instytucja publiczna',
  'Instytucja kultury',
  'Firma',
] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export const NO_AGREEMENT = 'Brak umowy';
export const PARTNER_AGREEMENTS = [
  'Umowa partnerska',
  'Porozumienie',
  'List intencyjny',
  NO_AGREEMENT,
] as const;
export type PartnerAgreement = (typeof PARTNER_AGREEMENTS)[number];

export const BUDGET_VERSION_STATUSES = [
  'DRAFT',
  'PENDING',
  'APPROVED',
] as const;
export type BudgetVersionStatus = (typeof BUDGET_VERSION_STATUSES)[number];

export const BUDGET_INVOICE_STATUSES = ['TO_BE_PAID', 'PAID'] as const;
export type BudgetInvoiceStatus = (typeof BUDGET_INVOICE_STATUSES)[number];

export const BUDGET_COLUMN_TYPES = ['text', 'money', 'person'] as const;
export type BudgetColumnType = (typeof BUDGET_COLUMN_TYPES)[number];

export const BUDGET_HISTORY_KINDS = [
  'CREATED',
  'EDITED',
  'SUBMITTED',
  'WITHDRAWN',
  'APPROVED',
  'REJECTED',
  'REVERTED',
  'DISCARDED',
  'METADATA_EDITED',
] as const;
export type BudgetHistoryKind = (typeof BUDGET_HISTORY_KINDS)[number];

export const BUDGET_PLAN_FIELDS = [
  'planned',
  'grant',
  'ownContribution',
] as const;
export type BudgetPlanField = (typeof BUDGET_PLAN_FIELDS)[number];

export const BUDGET_SPENT_COLUMN = 'incurred';

export const BUDGET_DEFAULT_COLUMNS: {
  key: string;
  name: string;
  type: BudgetColumnType;
  locked: boolean;
}[] = [
  { key: 'planned', name: 'Plan', type: 'money', locked: true },
  { key: 'incurred', name: 'Poniesione', type: 'money', locked: true },
  { key: 'person', name: 'Osoba odpowiedzialna', type: 'text', locked: false },
  { key: 'source', name: 'Źródło finansowania', type: 'text', locked: false },
  { key: 'grant', name: 'Dotacja', type: 'money', locked: true },
  { key: 'ownContribution', name: 'Wkład własny', type: 'money', locked: true },
];

export const BUDGET_DOCUMENT_KINDS = ['FOLDER', 'FILE'] as const;
export type BudgetDocumentKind = (typeof BUDGET_DOCUMENT_KINDS)[number];
