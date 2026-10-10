import { ActionMenu } from '../../../components/ui/ActionMenu';
import { formatNumericDate } from '../../projects/utils/isoDate';
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS } from '../data';
import type { Invoice, InvoiceStatus } from '../types';
import { formatMoney } from '../utils/budgetTotals';
import { DocumentLinkChip } from './DocumentLinkChip';

const INVOICE_TH_CLASSES =
  'px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-dark/75';

interface InvoicesRowProps {
  invoices: Invoice[];
  incurred: number;
  invoicesTotal: number;
  colSpan: number;
  folderPaths: Map<string, string> | null;
  canChangeStatus: boolean;
  onSetStatus: (invoiceId: string, status: InvoiceStatus) => void;
  onDelete: (invoiceId: string) => void;
  onRecalc: () => void;
}

export function InvoicesRow({
  invoices,
  incurred,
  invoicesTotal,
  colSpan,
  folderPaths,
  canChangeStatus,
  onSetStatus,
  onDelete,
  onRecalc,
}: InvoicesRowProps) {
  return (
    <tr className="animate-fade-in border-b border-gray-100 bg-white">
      <td colSpan={colSpan} className="px-5 pt-1 pb-4">
        <p className="mb-2 text-xs text-grayText">Faktury i dokumenty</p>
        {invoices.length > 0 && incurred !== invoicesTotal && (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amberSoft px-3 py-2 text-[11px] text-amberDark">
            <span>
              Poniesione ({formatMoney(incurred)}) różni się od sumy faktur (
              {formatMoney(invoicesTotal)}).
            </span>
            {canChangeStatus && (
              <button
                type="button"
                onClick={onRecalc}
                className="cursor-pointer font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:outline-none"
              >
                Przelicz z faktur
              </button>
            )}
          </div>
        )}
        {invoices.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-3 py-3 text-[11px] text-grayText">
            Brak faktur dla tej pozycji.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full border-collapse text-xs text-dark">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Nr dokumentu
                  </th>
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Poniesione
                  </th>
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Kontrahent
                  </th>
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Data
                  </th>
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Dotacja
                  </th>
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Wkład własny
                  </th>
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Wprowadził
                  </th>
                  <th scope="col" className={INVOICE_TH_CLASSES}>
                    Status
                  </th>
                  {canChangeStatus && (
                    <th scope="col" className="w-10">
                      <span className="sr-only">Akcje</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const nextStatus: InvoiceStatus =
                    invoice.status === 'PAID' ? 'TO_BE_PAID' : 'PAID';
                  const statusClasses = `inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${INVOICE_STATUS_CLASSES[invoice.status]}`;

                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-3 py-2.5">
                        {invoice.document ? (
                          <DocumentLinkChip
                            link={invoice.document}
                            folderPaths={folderPaths}
                            label={invoice.number}
                          />
                        ) : (
                          <span className="whitespace-nowrap">
                            {invoice.number}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-bold whitespace-nowrap tabular-nums">
                        {formatMoney(invoice.amount)}
                      </td>
                      <td className="px-3 py-2.5">{invoice.contractor}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {formatNumericDate(invoice.date)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {formatMoney(invoice.grant)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {formatMoney(invoice.ownContribution)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-md bg-lightGreen px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-darkGreen">
                          {invoice.enteredBy}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {canChangeStatus ? (
                          <button
                            type="button"
                            onClick={() => onSetStatus(invoice.id, nextStatus)}
                            aria-label={`Status faktury ${invoice.number}: ${INVOICE_STATUS_LABELS[invoice.status]}, kliknij, aby zmienić na ${INVOICE_STATUS_LABELS[nextStatus]}`}
                            title={`Zmień na: ${INVOICE_STATUS_LABELS[nextStatus]}`}
                            className={`${statusClasses} cursor-pointer transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:outline-none`}
                          >
                            {INVOICE_STATUS_LABELS[invoice.status]}
                          </button>
                        ) : (
                          <span className={statusClasses}>
                            {INVOICE_STATUS_LABELS[invoice.status]}
                          </span>
                        )}
                      </td>
                      {canChangeStatus && (
                        <td className="px-2 py-2.5 text-right">
                          <ActionMenu
                            ariaLabel={`Akcje faktury ${invoice.number}`}
                            className="inline-flex h-6 w-6 items-center justify-center"
                            items={[
                              {
                                id: 'delete',
                                label: 'Usuń fakturę',
                                tone: 'danger',
                                onSelect: () => onDelete(invoice.id),
                              },
                            ]}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </td>
    </tr>
  );
}
