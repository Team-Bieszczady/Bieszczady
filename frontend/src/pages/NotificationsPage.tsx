import NotificationItem from '../features/notifications/components/NotificationItem';
import { useNotifications } from '../features/notifications/hooks/useNotifications';
import { Spinner } from '../components/ui/Spinner';

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAllAsRead, markAsRead } =
    useNotifications();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-4 pt-20 lg:px-6 lg:pb-6 lg:pt-16">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-dark lg:text-2xl">
          Powiadomienia
        </h1>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          className="text-xs font-medium text-darkGreen transition-colors hover:underline disabled:cursor-default disabled:text-gray-400 disabled:no-underline"
        >
          Oznacz wszystkie jako przeczytane
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        {isLoading ? (
          <div
            role="status"
            aria-live="polite"
            className="flex justify-center px-4 py-12"
          >
            <Spinner variant="dark" size="24" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-400">
            Brak powiadomień
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={markAsRead}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
