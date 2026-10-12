import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import { LuDownload, LuPlus, LuSearch, LuX } from 'react-icons/lu';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { InlineQueryState } from '../components/ui/InlineQueryState';
import InvoiceFormModal, {
  type InvoiceFormInputs,
} from '../features/invoices/components/InvoiceFormModal';
import { InvoicesTable } from '../features/invoices/components/InvoicesTable';
import { InvoiceSummaryCards } from '../features/invoices/components/InvoiceSummaryCards';
import { ProjectTotalsSection } from '../features/invoices/components/ProjectTotalsSection';
import {
  filterInvoices,
  projectTotals,
  summarize,
  type InvoiceTab,
} from '../features/invoices/invoiceSummary';
import { toInvoicesCsv } from '../features/invoices/invoicesCsv';
import { downloadCsv, safeFileNamePart } from '../lib/csv';
import { useCreateInvoice } from '../features/invoices/hooks/useCreateInvoice';
import { useDeleteInvoice } from '../features/invoices/hooks/useDeleteInvoice';
import { useInvoices } from '../features/invoices/hooks/useInvoices';
import { useUpdateInvoice } from '../features/invoices/hooks/useUpdateInvoice';
import { useUpdateInvoiceStatus } from '../features/invoices/hooks/useUpdateInvoiceStatus';
import { useUploadInvoiceDocument } from '../features/invoices/hooks/useInvoiceDocument';
import { useProjects } from '../features/projects/hooks/useProjectsApi';
import { useSelectedProject } from '../context/useSelectedProject';
import { pluralizePl, type PluralForms } from '../lib/pluralizePl';
import type { BackendInvoice } from '../lib/api';
import { todayIso } from '../features/projects/utils/isoDate';

const INVOICE_FORMS: PluralForms = ['faktura', 'faktury', 'faktur'];

function byProjectName(invoices: BackendInvoice[], projectId: string | null) {
  if (projectId === null) return null;

  for (const invoice of invoices) {
    for (const share of invoice.shares) {
      if (share.projectId === projectId) return share.projectName;
    }
  }
  return null;
}

const STATUS_TABS: { value: InvoiceTab; label: string }[] = [
  { value: null, label: 'Wszystkie' },
  { value: 'TO_PAY', label: 'Do zapłaty' },
  { value: 'OVERDUE', label: 'Po terminie' },
  { value: 'PAID', label: 'Zapłacone' },
];

export default function KsefPage() {
  const [statusFilter, setStatusFilter] = useState<InvoiceTab>(null);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editedInvoice, setEditedInvoice] = useState<BackendInvoice | null>(
    null,
  );
  const [invoiceToDelete, setInvoiceToDelete] = useState<BackendInvoice | null>(
    null,
  );

  // Pobieramy wszystkie faktury raz: dzięki temu sumy liczą się z całości,
  // a zakładki i szukanie działają od razu, bez czekania na serwer.
  const invoicesQuery = useInvoices();
  const projectsQuery = useProjects();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();
  const uploadDocument = useUploadInvoiceDocument();
  const navigate = useNavigate();
  const { setProjectId } = useSelectedProject();

  const invoices = invoicesQuery.data ?? [];
  const shown = filterInvoices(invoices, statusFilter, search, projectFilter);
  const filteredProject = byProjectName(invoices, projectFilter);
  const totals = summarize(invoices);
  const byProject = projectTotals(invoices);
  const projectOptions = (projectsQuery.data ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const emptyMessage =
    invoices.length === 0
      ? 'Nie ma jeszcze żadnej faktury.'
      : 'Żadna faktura nie pasuje do wyszukiwania.';

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

  const exportCsv = () => {
    if (shown.length === 0) {
      toast.error('Nie ma czego eksportować');
      return;
    }

    const part = filteredProject ? `-${safeFileNamePart(filteredProject)}` : '';
    downloadCsv(toInvoicesCsv(shown), `faktury${part}-${todayIso()}.csv`);
    toast.success(`Pobrano ${pluralizePl(shown.length, INVOICE_FORMS)}`);
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
        <div className="flex items-center gap-2">
          {invoices.length > 0 && (
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={exportCsv}
              className="gap-1.5"
            >
              <LuDownload size={15} aria-hidden="true" />
              <span className="max-sm:hidden">Pobierz CSV</span>
            </Button>
          )}
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
      </div>

      {invoices.length > 0 && <InvoiceSummaryCards totals={totals} />}

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200">
        <div
          role="tablist"
          aria-label="Filtruj po statusie"
          className="flex gap-1"
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

        <div className="relative mb-2 w-full sm:w-64">
          <LuSearch
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
            placeholder="Szukaj po nazwie lub projekcie..."
            aria-label="Szukaj faktur"
            className="h-9 w-full rounded-lg border border-gray-200 pr-3 pl-9 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
          />
        </div>
      </div>

      {filteredProject && (
        <div className="-mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-grayText">Pokazuję tylko projekt:</span>
          <button
            type="button"
            onClick={() => setProjectFilter(null)}
            className="flex cursor-pointer items-center gap-1 rounded-full bg-lightGreen px-3 py-1 font-medium text-darkGreen hover:opacity-80"
          >
            {filteredProject}
            <LuX size={13} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <InlineQueryState
          isLoading={invoicesQuery.isPending}
          isError={invoicesQuery.isError}
          isFetching={invoicesQuery.isFetching}
          data={invoicesQuery.data}
          errorMessage="Nie udało się pobrać faktur."
          loadingMessage="Ładowanie faktur…"
          onRetry={() => void invoicesQuery.refetch()}
        >
          {() => (
            <InvoicesTable
              invoices={shown}
              emptyMessage={emptyMessage}
              onEdit={openEditForm}
              onDelete={setInvoiceToDelete}
              onToggleStatus={toggleStatus}
              onUploadFile={uploadFile}
              onOpenInDocuments={openInDocuments}
              isTogglingId={
                updateStatus.isPending ? updateStatus.variables?.id : undefined
              }
              isUploadingId={
                uploadDocument.isPending
                  ? uploadDocument.variables?.id
                  : undefined
              }
            />
          )}
        </InlineQueryState>
      </div>

      <ProjectTotalsSection
        totals={byProject}
        activeProjectId={projectFilter}
        onPick={(projectId) =>
          setProjectFilter((current) =>
            current === projectId ? null : projectId,
          )
        }
      />

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
          existingInvoices={invoices}
          projectOptions={projectOptions}
          onClose={closeForm}
          onSubmit={submitInvoice}
          isPending={createInvoice.isPending || updateInvoice.isPending}
        />
      )}
    </div>
  );
}
