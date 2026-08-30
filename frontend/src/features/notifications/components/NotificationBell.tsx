import { TfiBell } from 'react-icons/tfi';
import NotificationPanel from './NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';
import { useAnchoredPopup } from '../../../hooks/useAnchoredPopup';

export default function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAllAsRead, markAsRead } =
    useNotifications();
  const { isOpen, close, toggle, buttonRef, panelRef, position } =
    useAnchoredPopup<HTMLButtonElement, HTMLDivElement>({
      offset: 8,
      viewportMargin: 8,
      restoreFocus: true,
    });

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={
          unreadCount > 0
            ? `Powiadomienia, nieprzeczytane: ${unreadCount}`
            : 'Powiadomienia'
        }
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dark/30 text-dark transition-colors hover:bg-gray-50 hover:text-darkGreen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:ring-offset-2 lg:h-9 lg:w-9"
      >
        <TfiBell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full bg-darkRed ring-2 ring-white lg:right-1.5 lg:top-1.5"
            aria-hidden="true"
          />
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          panelRef={panelRef}
          position={position}
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onMarkAllAsRead={markAllAsRead}
          onMarkAsRead={markAsRead}
          onNavigate={close}
        />
      )}
    </>
  );
}
