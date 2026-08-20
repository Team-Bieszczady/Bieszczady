export type UserRole = 'DIRECTOR' | 'COORDINATOR' | 'EXECUTOR' | 'PARTNER';

export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface JwtPayload {
  sub: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}
