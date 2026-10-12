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
import { InvoiceStatusTabs } from '../features/invoices/components/InvoiceStatusTabs';

import { ProjectTotalsSection } from '../features/invoices/components/ProjectTotalsSection';
import {
  filterInvoices,
  projectTotals,
  tabCounts,
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
import { useInvoiceFilePreview } from '../features/invoices/hooks/useInvoiceFilePreview';
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
  const filePreview = useInvoiceFilePreview();
  const navigate = useNavigate();
  const { setProjectId } = useSelectedProject();

  const invoices = invoicesQuery.data ?? [];
  const searched = filterInvoices(invoices, null, search, projectFilter);
  const shown = filterInvoices(invoices, statusFilter, search, projectFilter);
  const filteredProject = byProjectName(invoices, projectFilter);

  const counts = tabCounts(searched);
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

  const previewFile = (invoice: BackendInvoice) => {
    const document = invoice.documents[0];
    if (!document) return;

    filePreview
      .preview(document.projectId, document.id, document.versionNo)
      .catch((error: Error) => toast.error(error.message));
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-16 pb-4 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-dark min-[500px]:text-xl lg:text-2xl">
          Faktury KSeF
        </h1>
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

      <div className="relative">
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
          className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
        />
      </div>

      <InvoiceStatusTabs
        value={statusFilter}
        counts={counts}
        total={searched.length}
        onChange={setStatusFilter}
      />

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

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white max-sm:border-0 max-sm:bg-transparent">
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
              onPreviewFile={previewFile}
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
