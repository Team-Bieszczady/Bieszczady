import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useDeleteInvoice() {
  return useApiMutation((token, id: string) => api.deleteInvoice(token, id), {
    invalidates: [['invoices']],
  });
}
