import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/useAuth';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';

export interface UpdateSelfPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export function useUpdateSelf() {
  const { user, updateUser } = useAuth();
  const { requireToken } = useAuthToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSelfPayload) => {
      if (!user) {
        throw new Error('Brak aktywnej sesji.');
      }
      return api.updateSelf(requireToken(), user.id, {
        ...payload,
        firstName: payload.firstName?.trim(),
        lastName: payload.lastName?.trim(),
      });
    },
    onSuccess: (updated) => {
      updateUser({
        firstName: updated.firstName,
        lastName: updated.lastName,
      });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
    },
  });
}
