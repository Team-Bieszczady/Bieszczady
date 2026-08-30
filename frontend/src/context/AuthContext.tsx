import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContextValue';
import type { AuthenticatedUser } from '../lib/api';
import { api, registerRefreshHandler } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const setSession = (token: string, userData: AuthenticatedUser) => {
    setAccessToken(token);
    setUser(userData);
  };

  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
  };

  const updateUser = (patch: Partial<AuthenticatedUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    registerRefreshHandler(async () => {
      try {
        const response = await api.refresh();
        setSession(response.accessToken, response.user);
        return response.accessToken;
      } catch {
        clearSession();
        return null;
      }
    });

    return () => registerRefreshHandler(null);
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      const response = await api.refresh().catch(() => null);
      if (response) setSession(response.accessToken, response.user);
      setIsInitializing(false);
    };

    initializeSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isInitializing,
        setSession,
        clearSession,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
