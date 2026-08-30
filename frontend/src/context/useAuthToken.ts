import { useAuth } from './useAuth';

export function useAuthToken() {
  const { accessToken } = useAuth();

  return {
    hasToken: !!accessToken,
    requireToken: (): string => {
      if (!accessToken) {
        throw new Error('Brak aktywnej sesji.');
      }
      return accessToken;
    },
  };
}
