import { formatAmount, type InvoiceTotals } from '../invoiceSummary';
import { pluralizePl, type PluralForms } from '../../../lib/pluralizePl';

const INVOICE_FORMS: PluralForms = ['faktura', 'faktury', 'faktur'];
const OVERDUE_FORMS: PluralForms = [
  'faktura po terminie',
  'faktury po terminie',
  'faktur po terminie',
];

const CARD_CLASSES =
  'rounded-xl border border-gray-200 bg-white px-4 py-4 transition-colors hover:bg-gray-50 800:px-5';

export function InvoiceSummaryCards({ totals }: { totals: InvoiceTotals }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className={CARD_CLASSES}>
        <p className="text-xs text-grayText">Razem</p>
        <p className="mt-1 text-sm font-bold text-dark">
          {formatAmount(totals.all)}
        </p>
        <p className="mt-1 text-xs text-grayText">
          {pluralizePl(totals.allCount, INVOICE_FORMS)}
        </p>
      </div>

      <div className={CARD_CLASSES}>
        <p className="text-xs text-grayText">Do zapłaty</p>
        <p className="mt-1 text-sm font-bold text-dark">
          {formatAmount(totals.toPay)}
        </p>
        <p
          className={`mt-1 text-xs ${totals.overdueCount > 0 ? 'font-medium text-darkRed' : 'text-grayText'}`}
        >
          {totals.overdueCount > 0
            ? `${pluralizePl(totals.overdueCount, OVERDUE_FORMS)} · ${formatAmount(totals.overdueAmount)}`
            : 'żadna nie zalega'}
        </p>
      </div>

      <div className={CARD_CLASSES}>
        <p className="text-xs text-grayText">Zapłacone</p>
        <p className="mt-1 text-sm font-bold text-darkGreen">
          {formatAmount(totals.paid)}
        </p>
        <p className="mt-1 text-xs text-grayText">
          {pluralizePl(totals.paidCount, INVOICE_FORMS)}
        </p>
      </div>
    </div>
  );
}
