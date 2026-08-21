export type AccountStatus = 'ACTIVE' | 'INACTIVE';

export interface JwtPayload {
  sub: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isDirector: boolean;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthenticatedUser;
}
