import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/useAuth';
import { clearStoredProjectId } from '../../../context/SelectedProjectContextValue';
import { api } from '../../../lib/api';

export function useLogout(): () => Promise<void> {
  const navigate = useNavigate();
  const { user, clearSession } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  return useCallback(async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Nie udało się wylogować po stronie serwera', error);
    }

    clearSession();
    queryClient.clear();
    if (userId) clearStoredProjectId(userId);
    navigate('/login', { replace: true });
    toast.success('Zostałeś wylogowany');
  }, [clearSession, queryClient, navigate, userId]);
}
