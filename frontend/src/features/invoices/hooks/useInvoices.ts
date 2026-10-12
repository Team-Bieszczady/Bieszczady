import { useApiQuery } from '../../../hooks/useApiQuery';
import { api } from '../../../lib/api';

export function useInvoices() {
  return useApiQuery(['invoices'], (token) => api.getInvoices(token));
}
