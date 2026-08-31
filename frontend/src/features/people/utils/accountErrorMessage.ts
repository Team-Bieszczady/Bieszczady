import toast from 'react-hot-toast';
import { isApiError } from '../../../lib/api';

export function accountErrorMessage(
  error: Error | null,
  fallback = 'Coś poszło nie tak. Spróbuj ponownie.',
): string {
  if (!isApiError(error)) return fallback;

  switch (error.status) {
    case 403:
      return 'Nie masz uprawnień do wykonania tej operacji.';
    case 404:
      return 'Nie znaleziono użytkownika.';
    case 409:
      return 'Nie można wykonać operacji na ostatnim aktywnym dyrektorze.';
    default:
      return error.message || fallback;
  }
}

export function toastAccountError(error: Error): void {
  toast.error(accountErrorMessage(error));
}
