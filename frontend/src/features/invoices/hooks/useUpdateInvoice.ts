import { useApiMutation } from '../../../hooks/useApiMutation';
import { api, type InvoiceChanges } from '../../../lib/api';

export function useUpdateInvoice() {
  return useApiMutation(
    (token, { id, changes }: { id: string; changes: InvoiceChanges }) =>
      api.updateInvoice(token, id, changes),
    { invalidates: [['invoices']] },
  );
}
