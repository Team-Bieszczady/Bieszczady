import { useMutation } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) => api.requestPasswordReset(email),
  });
}
