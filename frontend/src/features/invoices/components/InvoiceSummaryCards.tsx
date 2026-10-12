import { LuTriangleAlert } from 'react-icons/lu';
import { formatAmount, type InvoiceTotals } from '../invoiceSummary';
import { pluralizePl, type PluralForms } from '../../../lib/pluralizePl';

const OVERDUE_FORMS: PluralForms = [
  'faktura po terminie',
  'faktury po terminie',
  'faktur po terminie',
];

const CARD_CLASSES = 'rounded-xl border border-gray-200 bg-white px-4 py-3';
const LABEL_CLASSES = 'text-xs text-grayText';

export function InvoiceSummaryCards({ totals }: { totals: InvoiceTotals }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className={CARD_CLASSES}>
        <p className={LABEL_CLASSES}>Razem</p>
        <p className="mt-1 text-lg font-bold text-dark">
          {formatAmount(totals.all)}
        </p>
      </div>

      <div className={CARD_CLASSES}>
        <p className={LABEL_CLASSES}>Do zapłaty</p>
        <p className="mt-1 text-lg font-bold text-dark">
          {formatAmount(totals.toPay)}
        </p>
        {totals.overdueCount > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-darkRed">
            <LuTriangleAlert size={13} aria-hidden="true" />
            {pluralizePl(totals.overdueCount, OVERDUE_FORMS)} ·{' '}
            {formatAmount(totals.overdueAmount)}
          </p>
        )}
      </div>

      <div className={CARD_CLASSES}>
        <p className={LABEL_CLASSES}>Zapłacone</p>
        <p className="mt-1 text-lg font-bold text-darkGreen">
          {formatAmount(totals.paid)}
        </p>
      </div>
    </div>
  );
}
