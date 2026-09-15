import type { AuthenticatedUser } from '../../../lib/api';

export function isSelf(
  user: AuthenticatedUser | null,
  personId: string,
): boolean {
  return !!user && user.id === personId;
}
