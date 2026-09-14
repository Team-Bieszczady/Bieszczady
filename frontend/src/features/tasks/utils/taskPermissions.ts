import type { AuthenticatedUser } from '../../../lib/api';
import type { BackendMember } from '../../../lib/projectsApi';
import type { TaskRow } from '../data';

export function canManageTasks(
  user: AuthenticatedUser | null,
  members: BackendMember[],
): boolean {
  if (!user) return false;
  if (user.isDirector) return true;

  return members.some(
    (member) =>
      member.userId === user.id && member.projectRole === 'COORDINATOR',
  );
}

export function canChangeStatusOf(
  user: AuthenticatedUser | null,
  members: BackendMember[],
  ownerId: string | null,
): boolean {
  if (!user) return false;
  if (ownerId !== null && ownerId === user.id) return true;

  return canManageTasks(user, members);
}

export function canChangeTaskStatus(
  user: AuthenticatedUser | null,
  members: BackendMember[],
  row: TaskRow,
): boolean {
  return canChangeStatusOf(user, members, row.ownerId);
}

export function canManageSubtasks(
  user: AuthenticatedUser | null,
  row: TaskRow,
): boolean {
  return !!user && row.ownerId !== null && row.ownerId === user.id;
}
