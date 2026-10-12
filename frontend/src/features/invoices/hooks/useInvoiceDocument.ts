import { useApiMutation } from '../../../hooks/useApiMutation';
import { api } from '../../../lib/api';

export function useUploadInvoiceDocument() {
  return useApiMutation(
    (token, { id, file }: { id: string; file: File }) =>
      api.uploadInvoiceDocument(token, id, file),
    { invalidates: [['invoices']] },
  );
}

export function useDeleteInvoiceDocument() {
  return useApiMutation(
    (token, id: string) => api.deleteInvoiceDocument(token, id),
    { invalidates: [['invoices']] },
  );
}
