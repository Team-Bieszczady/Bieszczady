import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import {
  notificationsApi,
  type AppNotification,
  type BackendNotificationList,
} from '../../../lib/notificationsApi';

export const notificationKeys = {
  all: ['notifications'] as const,
};

export interface UseNotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
}

export function useNotifications(): UseNotificationsResult {
  const queryClient = useQueryClient();
  const { hasToken, requireToken } = useAuthToken();

  const { data, isLoading } = useQuery({
    queryKey: notificationKeys.all,
    queryFn: () => notificationsApi.list(requireToken()),
    enabled: hasToken,
    refetchInterval: 60_000,
  });

  const markLocally = (isTarget: (n: AppNotification) => boolean) => {
    const readAt = new Date().toISOString();
    queryClient.setQueryData<BackendNotificationList>(
      notificationKeys.all,
      (prev) => {
        if (!prev) return prev;
        const items = prev.items.map((n) =>
          !n.readAt && isTarget(n) ? { ...n, readAt } : n,
        );
        return {
          items,
          unreadCount:
            prev.unreadCount -
            prev.items.filter((n) => !n.readAt && isTarget(n)).length,
        };
      },
    );
  };

  const settle = () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(requireToken(), id),
    onMutate: (id) => markLocally((n) => n.id === id),
    onSettled: settle,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(requireToken()),
    onMutate: () => markLocally(() => true),
    onSettled: settle,
  });

  const notifications = data?.items ?? [];

  return {
    notifications,
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAllAsRead: () => markAll.mutate(),
    markAsRead: (id) => {
      if (notifications.some((n) => n.id === id && !n.readAt)) {
        markOne.mutate(id);
      }
    },
  };
}
