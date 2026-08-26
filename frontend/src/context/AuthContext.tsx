import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthenticatedUser } from '../lib/api';

interface AuthContextType {
  user: AuthenticatedUser | null;
  accessToken: string | null;
  setSession: (accessToken: string, user: AuthenticatedUser) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
