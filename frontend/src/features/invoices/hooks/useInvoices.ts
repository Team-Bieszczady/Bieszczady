import { useApiQuery } from '../../../hooks/useApiQuery';
import { api, type InvoiceStatus } from '../../../lib/api';

export function useInvoices(filters: { status?: InvoiceStatus } = {}) {
  return useApiQuery(['invoices', filters.status ?? 'all'], (token) =>
    api.getInvoices(token, filters),
  );
}
