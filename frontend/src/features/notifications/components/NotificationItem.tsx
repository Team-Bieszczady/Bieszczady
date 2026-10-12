import { cva } from 'class-variance-authority';
import type { IconType } from 'react-icons';
import { LuClipboardList, LuClock, LuTriangleAlert } from 'react-icons/lu';
import { formatRelativeTime } from '../utils/relativeTime';
import {
  DEADLINE_TONE_CLASSES,
  describeDeadline,
} from '../../tasks/utils/formatDeadline';
import { todayIso } from '../../projects/utils/isoDate';
import type {
  AppNotification,
  NotificationKind,
} from '../../../lib/notificationsApi';

const ICONS: Record<NotificationKind, IconType> = {
  TASK_ASSIGNED: LuClipboardList,
  TASK_DUE_SOON: LuClock,
  TASK_OVERDUE: LuTriangleAlert,
};

const itemVariants = cva(
  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-darkGreen',
  {
    variants: {
      read: {
        true: 'bg-white',
        false: 'bg-lightGreen/40',
      },
    },
  },
);

const iconVariants = cva(
  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
  {
    variants: {
      read: {
        true: 'bg-gray-100 text-gray-400',
        false: 'bg-lightGreen text-darkGreen',
      },
    },
  },
);

interface NotificationItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
}

function NotificationMessage({ notification }: { notification: AppNotification }) {
  const { kind, actor, task } = notification;
  const title = `„${task.title}”`;

  if (kind === 'TASK_ASSIGNED') {
    return (
      <>
        {actor ? (
          <span className="font-semibold">
            {actor.firstName} {actor.lastName}
          </span>
        ) : (
          'Ktoś'
        )}{' '}
        przypisał(a) Ci zadanie {title}
      </>
    );
  }

  const deadline = task.dueDate
    ? describeDeadline(task.dueDate, todayIso(), {
        isDone: task.status === 'DONE',
      })
    : null;

  return (
    <>
      {kind === 'TASK_DUE_SOON'
        ? `Zbliża się termin zadania ${title}`
        : `Minął termin zadania ${title}`}
      {deadline && (
        <>
          {', '}
          {deadline.date},{' '}
          <span className={DEADLINE_TONE_CLASSES[deadline.tone]}>
            {deadline.relative}
          </span>
        </>
      )}
    </>
  );
}

export default function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  const Icon = ICONS[notification.kind];
  const { readAt, createdAt, id, project } = notification;
  const read = readAt !== null;

  return (
    <li>
      <button
        type="button"
        onClick={() => onRead(id)}
        className={itemVariants({ read })}
      >
        <span className={iconVariants({ read })}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm text-dark">
            <NotificationMessage notification={notification} />
          </span>
          <span className="mt-0.5 block text-xs text-gray-400">
            {project.name} ·{' '}
            <time dateTime={createdAt}>{formatRelativeTime(createdAt)}</time>
          </span>
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
