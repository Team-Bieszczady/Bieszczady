import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: ({
      token,
      newPassword,
      confirmPassword,
    }: {
      token: string;
      newPassword: string;
      confirmPassword: string;
    }) => api.confirmPasswordReset(token, newPassword, confirmPassword),
  });
}
