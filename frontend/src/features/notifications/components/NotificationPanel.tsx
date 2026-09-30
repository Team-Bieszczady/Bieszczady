import { useEffect, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import NotificationItem from './NotificationItem';
import { Spinner } from '../../../components/ui/Spinner';
import type { AnchoredPosition } from '../../../hooks/useAnchoredPosition';
import type { AppNotification } from '../types';

interface NotificationPanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  position: AnchoredPosition;
  align: 'left' | 'right';
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAllAsRead: () => void;
  onMarkAsRead: (id: string) => void;
  onNavigate: () => void;
}

export default function NotificationPanel({
  panelRef,
  position,
  align,
  notifications,
  unreadCount,
  isLoading,
  onMarkAllAsRead,
  onMarkAsRead,
  onNavigate,
}: NotificationPanelProps) {
  useEffect(() => {
    panelRef.current?.focus();
  }, [panelRef]);

  const openUpward = position.placement === 'top';

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Powiadomienia"
      tabIndex={-1}
      style={{
        ...(openUpward
          ? { bottom: position.bottom }
          : { top: position.top }),
        ...(align === 'left'
          ? { left: position.left }
          : { right: position.right }),
        maxHeight: position.maxHeight,
      }}
      className="fixed z-40 flex w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg outline-none"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-dark">Powiadomienia</h2>
        <button
          type="button"
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          className="text-xs font-medium text-darkGreen transition-colors hover:underline disabled:cursor-default disabled:text-gray-400 disabled:no-underline"
        >
          Oznacz wszystkie jako przeczytane
        </button>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex justify-center px-4 py-8"
        >
          <Spinner variant="dark" size="24" />
        </div>
      ) : notifications.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-gray-400">
          Brak powiadomień
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto nav-scrollbar">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={onMarkAsRead}
            />
          ))}
        </ul>
      )}

      <div className="shrink-0 border-t border-gray-200 px-4 py-2.5 text-center">
        <Link
          to="/notifications"
          onClick={onNavigate}
          className="text-xs font-medium text-darkGreen hover:underline"
        >
          Zobacz wszystkie
        </Link>
      </div>
    </div>,
    document.body,
  );
}
