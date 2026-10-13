import { useRef } from 'react';
import {
  LuEye,
  LuFileUp,
  LuFolderOpen,
  LuPencil,
  LuTrash2,
} from 'react-icons/lu';
import type { BackendInvoice, InvoiceStatus } from '../../../lib/api';
import { canPreview } from '../../documents/utils/formatters';
import { formatNumericDate } from '../../projects/utils/isoDate';
import { formatAmount, isOverdue } from '../invoiceSummary';

interface InvoiceActions {
  onEdit: (invoice: BackendInvoice) => void;
  onDelete: (invoice: BackendInvoice) => void;
  onToggleStatus: (invoice: BackendInvoice) => void;
  onUploadFile: (invoice: BackendInvoice, file: File) => void;
  onOpenInDocuments: (invoice: BackendInvoice) => void;
  onPreviewFile: (invoice: BackendInvoice) => void;
  isTogglingId?: string;
  isUploadingId?: string;
}

interface InvoicesTableProps extends InvoiceActions {
  invoices: BackendInvoice[];
  emptyMessage: string;
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

function amountText(amount: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} zł`;
  return formatAmount(value);
}

function projectsText(invoice: BackendInvoice) {
  return invoice.shares
    .map((share) => `${share.projectName} (${amountText(share.amount)})`)
    .join(', ');
}

function StatusButton({
  invoice,
  onToggleStatus,
  isToggling,
}: {
  invoice: BackendInvoice;
  onToggleStatus: (invoice: BackendInvoice) => void;
  isToggling: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggleStatus(invoice)}
      disabled={isToggling}
      title={
        invoice.status === 'PAID'
          ? 'Kliknij, aby oznaczyć jako do zapłaty'
          : 'Kliknij, aby oznaczyć jako zapłaconą'
      }
      className={`inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80 disabled:cursor-wait disabled:opacity-60 ${STATUS_TONE[invoice.status]}`}
    >
      {STATUS_LABEL[invoice.status]}
    </button>
  );
}

function FileCell({
  invoice,
  onUploadFile,
  onOpenInDocuments,
  onPreviewFile,
  isUploading,
}: {
  invoice: BackendInvoice;
  onUploadFile: (invoice: BackendInvoice, file: File) => void;
  onOpenInDocuments: (invoice: BackendInvoice) => void;
  onPreviewFile: (invoice: BackendInvoice) => void;
  isUploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const document = invoice.documents[0];

  if (document) {
    return (
      <div className="flex items-center gap-3">
        {canPreview(document.mimeType) && (
          <button
            type="button"
            onClick={() => onPreviewFile(invoice)}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-medium whitespace-nowrap text-darkGreen hover:text-darkGreenHover"
          >
            <LuEye size={14} aria-hidden="true" />
            Podgląd
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenInDocuments(invoice)}
          title="Otwórz w drzewku Dokumentów"
          className="flex cursor-pointer items-center gap-1.5 text-xs whitespace-nowrap text-grayText hover:text-darkGreen"
        >
          <LuFolderOpen size={14} aria-hidden="true" />
          {canPreview(document.mimeType) ? '' : 'Zobacz w dokumentach'}
        </button>
      </div>
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

function RowActions({
  invoice,
  onEdit,
  onDelete,
}: {
  invoice: BackendInvoice;
  onEdit: (invoice: BackendInvoice) => void;
  onDelete: (invoice: BackendInvoice) => void;
}) {
  return (
    <div className="flex items-center gap-3">
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
  );
}

function PaymentDate({ invoice }: { invoice: BackendInvoice }) {
  const overdue = isOverdue(invoice);

  if (!overdue) {
    return (
      <span className="whitespace-nowrap text-dark">
        {formatNumericDate(invoice.paymentDate)}
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap font-medium text-darkRed">
      {formatNumericDate(invoice.paymentDate)}
      <span className="ml-1.5 text-xs font-normal">po terminie</span>
    </span>
  );
}

function InvoiceCard({
  invoice,
  actions,
}: {
  invoice: BackendInvoice;
  actions: InvoiceActions;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-dark">{invoice.name}</p>
        <p className="text-sm whitespace-nowrap text-dark">
          {amountText(invoice.amount)}
        </p>
      </div>

      <p className="mt-1 text-xs">
        <PaymentDate invoice={invoice} />
      </p>

      <p className="mt-1 text-xs text-grayText">{projectsText(invoice)}</p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <StatusButton
          invoice={invoice}
          onToggleStatus={actions.onToggleStatus}
          isToggling={actions.isTogglingId === invoice.id}
        />
        <FileCell
          invoice={invoice}
          onUploadFile={actions.onUploadFile}
          onOpenInDocuments={actions.onOpenInDocuments}
          onPreviewFile={actions.onPreviewFile}
          isUploading={actions.isUploadingId === invoice.id}
        />
        <RowActions
          invoice={invoice}
          onEdit={actions.onEdit}
          onDelete={actions.onDelete}
        />
      </div>
    </div>
  );
}

export function InvoicesTable({
  invoices,
  emptyMessage,
  ...actions
}: InvoicesTableProps) {
  if (invoices.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-gray-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} invoice={invoice} actions={actions} />
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-gray-200 bg-gray-100">
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
                  {amountText(invoice.amount)}
                </td>
                <td className="px-4 py-3 text-sm">
                  <PaymentDate invoice={invoice} />
                </td>
                <td className="px-4 py-3 text-xs text-grayText">
                  {projectsText(invoice)}
                </td>
                <td className="px-4 py-3">
                  <StatusButton
                    invoice={invoice}
                    onToggleStatus={actions.onToggleStatus}
                    isToggling={actions.isTogglingId === invoice.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <FileCell
                    invoice={invoice}
                    onUploadFile={actions.onUploadFile}
                    onOpenInDocuments={actions.onOpenInDocuments}
                    onPreviewFile={actions.onPreviewFile}
                    isUploading={actions.isUploadingId === invoice.id}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <RowActions
                      invoice={invoice}
                      onEdit={actions.onEdit}
                      onDelete={actions.onDelete}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
