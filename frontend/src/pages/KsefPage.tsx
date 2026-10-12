import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { LuPlus } from 'react-icons/lu';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import InvoiceFormModal, {
  type InvoiceFormInputs,
} from '../features/invoices/components/InvoiceFormModal';
import { InvoicesTable } from '../features/invoices/components/InvoicesTable';
import { useCreateInvoice } from '../features/invoices/hooks/useCreateInvoice';
import { useDeleteInvoice } from '../features/invoices/hooks/useDeleteInvoice';
import { useInvoices } from '../features/invoices/hooks/useInvoices';
import { useUpdateInvoice } from '../features/invoices/hooks/useUpdateInvoice';
import { useUpdateInvoiceStatus } from '../features/invoices/hooks/useUpdateInvoiceStatus';
import { useUploadInvoiceDocument } from '../features/invoices/hooks/useInvoiceDocument';
import { useProjects } from '../features/projects/hooks/useProjectsApi';
import { useSelectedProject } from '../context/useSelectedProject';
import { pluralizePl, type PluralForms } from '../lib/pluralizePl';
import type { BackendInvoice, InvoiceStatus } from '../lib/api';

const INVOICE_FORMS: PluralForms = ['faktura', 'faktury', 'faktur'];

const STATUS_TABS: { value: InvoiceStatus | null; label: string }[] = [
  { value: null, label: 'Wszystkie' },
  { value: 'TO_PAY', label: 'Do zapłaty' },
  { value: 'PAID', label: 'Zapłacone' },
];

export default function KsefPage() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<BackendInvoice | null>(
    null,
  );
  const [invoiceToDelete, setInvoiceToDelete] = useState<BackendInvoice | null>(
    null,
  );

  const invoicesQuery = useInvoices(
    statusFilter ? { status: statusFilter } : {},
  );
  const projectsQuery = useProjects();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const uploadDocument = useUploadInvoiceDocument();
  const navigate = useNavigate();
  const { setProjectId } = useSelectedProject();

  const invoices = invoicesQuery.data ?? [];
  const projectOptions = (projectsQuery.data ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const openAddForm = () => {
    setEditedInvoice(null);
    setIsFormOpen(true);
  };

  const openEditForm = (invoice: BackendInvoice) => {
    setEditedInvoice(invoice);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditedInvoice(null);
  };

  const submitInvoice = (values: InvoiceFormInputs) => {
    const changes = {
      name: values.name,
      amount: values.amount,
      paymentDate: values.paymentDate,
      shares: values.shares,
    };

    if (editedInvoice) {
      updateInvoice.mutate(
        { id: editedInvoice.id, changes },
        {
          onSuccess: () => {
            closeForm();
            toast.success('Zmiany zapisane');
          },
          onError: (error) => toast.error(error.message),
        },
      );
      return;
    }

    createInvoice.mutate(changes, {
      onSuccess: () => {
        closeForm();
        toast.success('Faktura dodana');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const toggleStatus = (invoice: BackendInvoice) => {
    const next = invoice.status === 'PAID' ? 'TO_PAY' : 'PAID';
    updateStatus.mutate(
      { id: invoice.id, status: next },
      {
        onSuccess: () =>
          toast.success(
            next === 'PAID'
              ? 'Oznaczono jako zapłaconą'
              : 'Oznaczono jako do zapłaty',
          ),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const uploadFile = (invoice: BackendInvoice, file: File) => {
    uploadDocument.mutate(
      { id: invoice.id, file },
      {
        onSuccess: () => toast.success('Plik faktury trafił do Dokumentów'),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  // Faktura leży w Dokumentach każdego projektu z podziału, więc otwieramy
  // pierwszy z nich i od razu właściwy folder.
  const openInDocuments = (invoice: BackendInvoice) => {
    const document = invoice.documents[0];
    if (!document) return;

    setProjectId(document.projectId);
    void navigate(`/project/documents?folder=${document.folderId}`);
  };

  const confirmDelete = () => {
    if (!invoiceToDelete) return;

    deleteInvoice.mutate(invoiceToDelete.id, {
      onSuccess: () => {
        setInvoiceToDelete(null);
        toast.success('Faktura usunięta');
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pt-16 pb-4 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-dark min-[500px]:text-xl lg:text-2xl">
            Faktury KSeF
          </h1>
          <p className="mt-1 text-xs text-grayText">
            {pluralizePl(invoices.length, INVOICE_FORMS)} w rejestrze
          </p>
        </div>
        <Button
          variant="primary"
          size="small"
          type="button"
          onClick={openAddForm}
          className="gap-1.5"
        >
          <LuPlus size={16} aria-hidden="true" />
          Dodaj fakturę
        </Button>
      </div>

      <div
        role="tablist"
        aria-label="Filtruj po statusie"
        className="flex gap-1 border-b border-gray-200"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = tab.value === statusFilter;
          return (
            <button
              key={tab.value ?? 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex cursor-pointer items-center border-b-2 px-3 py-2.5 text-xs whitespace-nowrap transition-colors focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none ${
                isActive
                  ? 'border-darkGreen font-semibold text-darkGreen'
                  : 'border-transparent text-grayText hover:text-dark'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {invoicesQuery.isError && (
        <p role="alert" className="text-xs text-darkRed">
          {invoicesQuery.error.message}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <InvoicesTable
          invoices={invoices}
          onEdit={openEditForm}
          onDelete={setInvoiceToDelete}
          onToggleStatus={toggleStatus}
          onUploadFile={uploadFile}
          onOpenInDocuments={openInDocuments}
          isTogglingId={
            updateStatus.isPending ? updateStatus.variables?.id : undefined
          }
          isUploadingId={
            uploadDocument.isPending ? uploadDocument.variables?.id : undefined
          }
        />
      </div>

      <ConfirmDialog
        isOpen={invoiceToDelete !== null}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={confirmDelete}
        title="Usuń fakturę"
        description={`Czy na pewno chcesz usunąć fakturę „${invoiceToDelete?.name ?? ''}”?`}
        confirmLabel="Usuń"
        tone="danger"
        isPending={deleteInvoice.isPending}
      />

      {isFormOpen && (
        <InvoiceFormModal
          invoice={editedInvoice ?? undefined}
          projectOptions={projectOptions}
          onClose={closeForm}
          onSubmit={submitInvoice}
          isPending={createInvoice.isPending || updateInvoice.isPending}
        />
      )}
    </div>
  );
}
