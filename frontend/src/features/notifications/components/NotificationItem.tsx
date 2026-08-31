import type { IconType } from 'react-icons';
import { LuClipboardList, LuFolderPlus, LuMessageSquare } from 'react-icons/lu';
import { formatRelativeTime } from '../utils/relativeTime';
import type { AppNotification, NotificationKind } from '../types';

const ICONS: Record<NotificationKind, IconType> = {
  TASK_ASSIGNED: LuClipboardList,
  PROJECT_ADDED: LuFolderPlus,
  COMMENT_ADDED: LuMessageSquare,
};

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const Icon = ICONS[notification.kind];
  const { read, message, createdAt, id } = notification;

  return (
    <li>
      <button
        type="button"
        onClick={() => onRead(id)}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-darkGreen ${
          read ? 'bg-white' : 'bg-lightGreen/40'
        }`}
      >
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            read ? 'bg-gray-100 text-gray-400' : 'bg-lightGreen text-darkGreen'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm text-dark">{message}</span>
          <time
            dateTime={createdAt}
            className="mt-0.5 block text-xs text-gray-400"
          >
            {formatRelativeTime(createdAt)}
          </time>
        </span>

        {!read && (
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-darkRed"
            aria-hidden="true"
          />
        )}
      </button>
    </li>
  );
}
