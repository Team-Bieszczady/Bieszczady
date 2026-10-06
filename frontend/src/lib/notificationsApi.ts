import { request } from './api';
import type { NamedRef, PersonRef, TaskStatusValue } from './projectsApi';

const BASE = '/api/v1';

export type NotificationKind =
  'TASK_ASSIGNED' | 'TASK_DUE_SOON' | 'TASK_OVERDUE';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  createdAt: string;
  readAt: string | null;
  actor: PersonRef | null;
  task: {
    id: string;
    title: string;
    dueDate: string | null;
    status: TaskStatusValue;
  };
  project: NamedRef;
}

export interface BackendNotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export const notificationsApi = {
  list: (accessToken: string) =>
    request<BackendNotificationList>(`${BASE}/notifications`, {
      method: 'GET',
      accessToken,
      fallbackMessage: 'Nie udało się pobrać powiadomień',
    }),
  markRead: (accessToken: string, id: string) =>
    request<void>(`${BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      accessToken,
      fallbackMessage: 'Nie udało się oznaczyć powiadomienia',
    }),
  markAllRead: (accessToken: string) =>
    request<void>(`${BASE}/notifications/read-all`, {
      method: 'PATCH',
      accessToken,
      fallbackMessage: 'Nie udało się oznaczyć powiadomień',
    }),
};
