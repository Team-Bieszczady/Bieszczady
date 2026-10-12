import type { BackendInvoice, InvoiceStatus } from '../../lib/api';
import { toIsoDate, todayIso } from '../projects/utils/isoDate';

export interface InvoiceTotals {
  all: number;
  allCount: number;
  toPay: number;
  paid: number;
  paidCount: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface ProjectTotal {
  projectId: string;
  projectName: string;
  amount: number;
  invoiceCount: number;
}

function amountOf(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return amount;
}

function round(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function formatAmount(amount: number) {
  return `${amount.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} zł`;
}

// Faktura po terminie to taka, której nikt nie zapłacił, a dzień zapłaty minął.
export function isOverdue(invoice: BackendInvoice, today: string = todayIso()) {
  if (invoice.status === 'PAID') return false;
  return toIsoDate(invoice.paymentDate) < today;
}

export interface InvoiceTabCounts {
  toPay: number;
  paid: number;
  overdue: number;
}

export function tabCounts(
  invoices: BackendInvoice[],
  today: string = todayIso(),
): InvoiceTabCounts {
  let toPay = 0;
  let paid = 0;
  let overdue = 0;

  for (const invoice of invoices) {
    if (invoice.status === 'PAID') {
      paid += 1;
    } else {
      toPay += 1;
    }

    if (isOverdue(invoice, today)) {
      overdue += 1;
    }
  }

  return { toPay, paid, overdue };
}

export function summarize(
  invoices: BackendInvoice[],
  today: string = todayIso(),
): InvoiceTotals {
  const totals = {
    all: 0,
    allCount: 0,
    toPay: 0,
    paid: 0,
    paidCount: 0,
    overdueCount: 0,
    overdueAmount: 0,
  };

  for (const invoice of invoices) {
    const amount = amountOf(invoice.amount);
    totals.all += amount;
    totals.allCount += 1;

    if (invoice.status === 'PAID') {
      totals.paid += amount;
      totals.paidCount += 1;
    } else {
      totals.toPay += amount;
    }

    if (isOverdue(invoice, today)) {
      totals.overdueCount += 1;
      totals.overdueAmount += amount;
    }
  }

  return {
    all: round(totals.all),
    allCount: totals.allCount,
    toPay: round(totals.toPay),
    paid: round(totals.paid),
    paidCount: totals.paidCount,
    overdueCount: totals.overdueCount,
    overdueAmount: round(totals.overdueAmount),
  };
}

// Po to jest cały ten moduł: ile z faktur przypada na który projekt.
export function projectTotals(invoices: BackendInvoice[]): ProjectTotal[] {
  const byProject = new Map<string, ProjectTotal>();

  for (const invoice of invoices) {
    for (const share of invoice.shares) {
      const current = byProject.get(share.projectId);

      if (current) {
        current.amount += amountOf(share.amount);
        current.invoiceCount += 1;
      } else {
        byProject.set(share.projectId, {
          projectId: share.projectId,
          projectName: share.projectName,
          amount: amountOf(share.amount),
          invoiceCount: 1,
        });
      }
    }
  }

  const totals = [...byProject.values()];
  for (const total of totals) {
    total.amount = round(total.amount);
  }

  return totals.sort((a, b) => b.amount - a.amount);
}

export function matchesSearch(invoice: BackendInvoice, search: string) {
  const text = search.trim().toLowerCase();
  if (text === '') return true;

  if (invoice.name.toLowerCase().includes(text)) return true;

  return invoice.shares.some((share) =>
    share.projectName.toLowerCase().includes(text),
  );
}

export type InvoiceTab = InvoiceStatus | 'OVERDUE' | null;

export function filterInvoices(
  invoices: BackendInvoice[],
  tab: InvoiceTab,
  search: string,
  projectId: string | null = null,
  today: string = todayIso(),
) {
  return invoices.filter((invoice) => {
    if (tab === 'OVERDUE' && !isOverdue(invoice, today)) return false;
    if (tab !== null && tab !== 'OVERDUE' && invoice.status !== tab) {
      return false;
    }

    if (
      projectId !== null &&
      !invoice.shares.some((share) => share.projectId === projectId)
    ) {
      return false;
    }

    return matchesSearch(invoice, search);
  });
}
