import { useQuery, useQueryClient } from '@tanstack/react-query';
import { buildMockNotifications } from '../data/mockNotifications';
import type { AppNotification } from '../types';

const NOTIFICATIONS_KEY = ['notifications'] as const;

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
}

export function useNotifications(): UseNotificationsResult {
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => buildMockNotifications(),
    staleTime: 60_000,
  });

  const patch = (fn: (n: AppNotification) => AppNotification) => {
    queryClient.setQueryData<AppNotification[]>(
      NOTIFICATIONS_KEY,
      (prev) => prev?.map(fn) ?? [],
    );
  };

  return {
    notifications: data,
    unreadCount: data.filter((n) => !n.read).length,
    isLoading,
    markAllAsRead: () => patch((n) => (n.read ? n : { ...n, read: true })),
    markAsRead: (id) =>
      patch((n) => (n.id === id && !n.read ? { ...n, read: true } : n)),
  };
}
