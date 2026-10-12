import { useRef } from 'react';
import { LuFileUp, LuPaperclip, LuPencil, LuTrash2 } from 'react-icons/lu';
import type { BackendInvoice, InvoiceStatus } from '../../../lib/api';
import { formatNumericDate } from '../../projects/utils/isoDate';

interface InvoicesTableProps {
  invoices: BackendInvoice[];
  onEdit: (invoice: BackendInvoice) => void;
  onDelete: (invoice: BackendInvoice) => void;
  onToggleStatus: (invoice: BackendInvoice) => void;
  onUploadFile: (invoice: BackendInvoice, file: File) => void;
  onOpenInDocuments: (invoice: BackendInvoice) => void;
  isTogglingId?: string;
  isUploadingId?: string;
}

const HEADERS = [
  'FAKTURA',
  'KWOTA',
  'DATA ZAPŁATY',
  'PROJEKTY',
  'STATUS',
  'PLIK',
  '',
];

const TH_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-gray-600 uppercase';

const STATUS_TONE: Record<InvoiceStatus, string> = {
  TO_PAY: 'bg-amber-100 text-amber-700',
  PAID: 'bg-lightGreen text-darkGreen',
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  TO_PAY: 'Do zapłaty',
  PAID: 'Zapłacona',
};

function formatAmount(amount: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} zł`;
  return `${value.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
}

function FileCell({
  invoice,
  onUploadFile,
  onOpenInDocuments,
  isUploading,
}: {
  invoice: BackendInvoice;
  onUploadFile: (invoice: BackendInvoice, file: File) => void;
  onOpenInDocuments: (invoice: BackendInvoice) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (invoice.documents.length > 0) {
    return (
      <button
        type="button"
        onClick={() => onOpenInDocuments(invoice)}
        className="flex cursor-pointer items-center gap-1.5 text-xs font-medium whitespace-nowrap text-darkGreen hover:text-darkGreenHover"
      >
        <LuPaperclip size={14} aria-hidden="true" />
        Zobacz w dokumentach
      </button>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files ? event.target.files[0] : null;
          if (file) onUploadFile(invoice, file);
          event.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="flex cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap text-grayText hover:text-darkGreen disabled:cursor-wait disabled:opacity-60"
      >
        <LuFileUp size={14} aria-hidden="true" />
        {isUploading ? 'Wgrywam…' : 'Wgraj plik'}
      </button>
    </>
  );
}

export function InvoicesTable({
  invoices,
  onEdit,
  onDelete,
  onToggleStatus,
  onUploadFile,
  onOpenInDocuments,
  isTogglingId,
  isUploadingId,
}: InvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-gray-400">
        Nie ma jeszcze żadnej faktury.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead className="border-b border-gray-200">
          <tr>
            {HEADERS.map((header) => (
              <th key={header} className={TH_CLASSES}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-dark">
                {invoice.name}
              </td>
              <td className="px-4 py-3 text-sm whitespace-nowrap text-dark">
                {formatAmount(invoice.amount)}
              </td>
              <td className="px-4 py-3 text-sm whitespace-nowrap text-dark">
                {formatNumericDate(invoice.paymentDate)}
              </td>
              <td className="px-4 py-3 text-xs text-grayText">
                {invoice.shares
                  .map(
                    (share) =>
                      `${share.projectName} (${formatAmount(share.amount)})`,
                  )
                  .join(', ')}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onToggleStatus(invoice)}
                  disabled={isTogglingId === invoice.id}
                  className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-60 ${STATUS_TONE[invoice.status]}`}
                >
                  {STATUS_LABEL[invoice.status]}
                </button>
              </td>
              <td className="px-4 py-3">
                <FileCell
                  invoice={invoice}
                  onUploadFile={onUploadFile}
                  onOpenInDocuments={onOpenInDocuments}
                  isUploading={isUploadingId === invoice.id}
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(invoice)}
                    aria-label={`Edytuj fakturę ${invoice.name}`}
                    className="cursor-pointer text-dark/50 hover:text-darkGreen"
                  >
                    <LuPencil size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(invoice)}
                    aria-label={`Usuń fakturę ${invoice.name}`}
                    className="cursor-pointer text-dark/50 hover:text-darkRed"
                  >
                    <LuTrash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
