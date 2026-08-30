import type { AccountStatus } from '../../lib/api';

export type PersonStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE' | 'DELETED';

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  initials: string;
  email: string;
  phone: string;
  avatar: string | null;
  role: string;
  isDirector: boolean;
  projects: Array<{ id: string; name: string }>;
  tasksCount: number;
  status: PersonStatus;
  accountStatus: AccountStatus;
  lastLoginAt: string | null;
  createdAt: string;
}
