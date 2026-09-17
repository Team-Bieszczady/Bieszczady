import toast from 'react-hot-toast';
import { isApiError } from '../../../lib/api';

export function accountErrorMessage(
  error: Error | null,
  fallback = 'Coś poszło nie tak. Spróbuj ponownie.',
): string {
  if (!isApiError(error)) return fallback;

  return error.message || fallback;
}

export function toastAccountError(error: Error): void {
  const message = accountErrorMessage(error);
  toast.error(message, { id: message });
}
