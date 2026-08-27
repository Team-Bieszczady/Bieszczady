import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';

interface UseSetPasswordParams {
  accessToken: string;
}

export function useSetPassword({ accessToken }: UseSetPasswordParams) {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => api.changePassword(accessToken, currentPassword, newPassword),
  });
}
