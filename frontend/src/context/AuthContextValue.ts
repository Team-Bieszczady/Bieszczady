import { createContext } from 'react';
import type { AuthenticatedUser } from '../lib/api';

export interface AuthContextType {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  setSession: (accessToken: string, user: AuthenticatedUser) => void;
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
