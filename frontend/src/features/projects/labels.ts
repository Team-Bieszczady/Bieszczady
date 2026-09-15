import type {
  ProjectRoleValue,
  RiskLevelValue,
  TaskPriorityValue,
  TaskStatusValue,
} from '../../lib/projectsApi';

export const RISK_LEVEL_LABELS: Record<RiskLevelValue, string> = {
  HIGH: 'WYSOKIE',
  MEDIUM: 'ŚREDNIE',
  LOW: 'NISKIE',
};

export const RISK_LEVEL_OPTIONS = (
  Object.keys(RISK_LEVEL_LABELS) as RiskLevelValue[]
).map((level) => ({ value: level, label: RISK_LEVEL_LABELS[level] }));


export const PROJECT_ROLE_LABELS: Record<ProjectRoleValue, string> = {
  COORDINATOR: 'Koordynator',
  EXECUTOR: 'Wykonawca',
  PARTNER: 'Partner',
};

export const PROJECT_ROLE_OPTIONS = (
  Object.keys(PROJECT_ROLE_LABELS) as ProjectRoleValue[]
).map((role) => ({ value: role, label: PROJECT_ROLE_LABELS[role] }));

export const TASK_STATUS_LABELS: Record<TaskStatusValue, string> = {
  NEW: 'Nowe',
  IN_PROGRESS: 'W toku',
  BLOCKED: 'Zablokowane',
  DONE: 'Zrobione',
};

export const TASK_STATUS_OPTIONS = (
  Object.keys(TASK_STATUS_LABELS) as TaskStatusValue[]
).map((status) => ({ value: status, label: TASK_STATUS_LABELS[status] }));

export const TASK_PRIORITY_LABELS: Record<TaskPriorityValue, string> = {
  HIGH: 'Wysoki',
  MEDIUM: 'Średni',
  LOW: 'Niski',
};

export const TASK_PRIORITY_OPTIONS = (
  Object.keys(TASK_PRIORITY_LABELS) as TaskPriorityValue[]
).map((priority) => ({
  value: priority,
  label: TASK_PRIORITY_LABELS[priority],
}));
