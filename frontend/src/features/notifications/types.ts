export type NotificationKind =
  | 'TASK_ASSIGNED'
  | 'PROJECT_ADDED'
  | 'COMMENT_ADDED';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  message: string;
  createdAt: string;
  read: boolean;
}
