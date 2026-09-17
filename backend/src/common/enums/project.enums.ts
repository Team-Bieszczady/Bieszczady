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

export const TASK_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const STAGE_DELETE_STRATEGIES = ['none', 'move', 'delete'] as const;
export type StageDeleteStrategy = (typeof STAGE_DELETE_STRATEGIES)[number];
