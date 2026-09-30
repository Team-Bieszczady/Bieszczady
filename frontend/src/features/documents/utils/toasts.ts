import toast from 'react-hot-toast';
import { isApiError } from '../../../lib/api';

// Jeden identyfikator na cały moduł: kolejny błąd zastępuje poprzedni dymek,
// zamiast układać stos, gdy ktoś kilka razy kliknie tę samą akcję.
const DOCUMENTS_TOAST_ID = 'documents';

export function showError(error: Error) {
  const message = isApiError(error) ? error.message : 'Coś poszło nie tak';
  toast.error(message, { id: DOCUMENTS_TOAST_ID });
}

export function showSuccess(message: string) {
  toast.success(message, { id: DOCUMENTS_TOAST_ID });
}
