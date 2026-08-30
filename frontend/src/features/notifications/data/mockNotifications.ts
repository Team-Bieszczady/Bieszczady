import type { AppNotification, NotificationKind } from '../types';

const SEEDS: Array<{
  id: string;
  kind: NotificationKind;
  message: string;
  minutesAgo: number;
  read: boolean;
}> = [
  {
    id: 'n1',
    kind: 'TASK_ASSIGNED',
    message: 'Nowe zadanie w projekcie „Szlak rowerowy”',
    minutesAgo: 5,
    read: false,
  },
  {
    id: 'n2',
    kind: 'PROJECT_ADDED',
    message: 'Zostałeś dodany do projektu „Remont mostu”',
    minutesAgo: 120,
    read: false,
  },
  {
    id: 'n3',
    kind: 'COMMENT_ADDED',
    message: 'Nowy komentarz w zadaniu „Oznakowanie”',
    minutesAgo: 1440,
    read: true,
  },
];

export function buildMockNotifications(): AppNotification[] {
  return SEEDS.map(({ minutesAgo, ...seed }) => ({
    ...seed,
    createdAt: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  }));
}
