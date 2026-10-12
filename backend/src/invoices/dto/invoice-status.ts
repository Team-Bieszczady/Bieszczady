export const INVOICE_STATUSES = ['TO_PAY', 'PAID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
