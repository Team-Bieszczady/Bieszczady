import type { BackendInvoice } from '../../lib/api';
import { buildCsv } from '../../lib/csv';
import { formatNumericDate } from '../projects/utils/isoDate';

const HEADERS = [
  'Nazwa',
  'Kwota',
  'Data zapłaty',
  'Status',
  'Projekty',
  'Plik w dokumentach',
];

const STATUS_LABEL: Record<string, string> = {
  TO_PAY: 'Do zapłaty',
  PAID: 'Zapłacona',
};

// Kwoty idą z przecinkiem, bo polski Excel tak czyta liczby.
function amountCell(amount: string) {
  return amount.replace('.', ',');
}

function projectsCell(invoice: BackendInvoice) {
  return invoice.shares
    .map((share) => `${share.projectName}: ${amountCell(share.amount)}`)
    .join(', ');
}

export function toInvoicesCsv(invoices: BackendInvoice[]) {
  const rows = invoices.map((invoice) => [
    invoice.name,
    amountCell(invoice.amount),
    formatNumericDate(invoice.paymentDate),
    STATUS_LABEL[invoice.status] ?? invoice.status,
    projectsCell(invoice),
    invoice.documents.length > 0 ? 'tak' : 'nie',
  ]);

  return buildCsv(HEADERS, rows);
}
