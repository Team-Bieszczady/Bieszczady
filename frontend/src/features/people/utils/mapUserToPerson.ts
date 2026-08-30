import type { BackendUser } from '../../../lib/api';
import type { Person, PersonStatus } from '../data';
import {
  DIRECTOR_ROLE_LABEL,
  PLACEHOLDER_PROJECTS,
  PLACEHOLDER_ROLE,
} from '../constants';

function displayStatus(user: BackendUser): PersonStatus {
  if (user.deletedAt) return 'DELETED';
  if (user.accountStatus === 'ACTIVE' && !user.lastLogin) return 'PENDING';
  return user.accountStatus;
}

export function mapUserToPerson(user: BackendUser): Person {
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const role = user.isDirector ? DIRECTOR_ROLE_LABEL : PLACEHOLDER_ROLE;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    initials,
    email: user.email,
    phone: user.phone ?? '',
    avatar: user.avatar || null,
    role,
    isDirector: user.isDirector,
    projects: [...PLACEHOLDER_PROJECTS],
    tasksCount: 0,
    status: displayStatus(user),
    accountStatus: user.accountStatus,
    lastLoginAt: user.lastLogin,
    createdAt: user.createdAt,
  };
}
