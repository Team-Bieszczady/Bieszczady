import { createContext } from 'react';
import type { AuthenticatedUser } from '../lib/api';

export interface AuthContextType {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  isInitializing: boolean;
  setSession: (accessToken: string, user: AuthenticatedUser) => void;
  clearSession: () => void;
  updateUser: (patch: Partial<AuthenticatedUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
