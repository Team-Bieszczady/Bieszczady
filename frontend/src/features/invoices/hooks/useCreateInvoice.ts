import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type InvoiceChanges } from '../../../lib/api';

export function useCreateInvoice() {
  return useApiMutation(
    (token, invoice: InvoiceChanges) => api.createInvoice(token, invoice),
    { invalidates: [['invoices']] },
  );
}
