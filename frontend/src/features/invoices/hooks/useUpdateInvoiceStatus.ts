import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type InvoiceStatus } from '../../../lib/api';

export function useUpdateInvoiceStatus() {
  return useApiMutation(
    (token, { id, status }: { id: string; status: InvoiceStatus }) =>
      api.updateInvoiceStatus(token, id, status),
    { invalidates: [['invoices']] },
  );
}
