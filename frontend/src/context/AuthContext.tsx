import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextValue';
import type { AuthenticatedUser } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const setSession = (token: string, userData: AuthenticatedUser) => {
    setAccessToken(token);
    setUser(userData);
  };

  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}
