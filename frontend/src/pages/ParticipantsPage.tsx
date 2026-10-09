import { useState } from 'react';
import toast from 'react-hot-toast';
import { AiOutlineSearch } from 'react-icons/ai';
import { HiOutlineDownload, HiOutlinePlus } from 'react-icons/hi';
import { LuFolderDown } from 'react-icons/lu';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import Pagination from '../features/people/components/Pagination';
import ParticipantFormModal from '../features/participants/components/ParticipantFormModal';
import { ProjectParticipantsExportModal } from '../features/participants/components/ProjectParticipantsExportModal';
import ParticipantsTable from '../features/participants/components/ParticipantsTable';
import { useCreateParticipant } from '../features/participants/hooks/useCreateParticipant';
import { useDeleteParticipant } from '../features/participants/hooks/useDeleteParticipant';
import { useNewsletterExport } from '../features/participants/hooks/useNewsletterExport';
import { useParticipants } from '../features/participants/hooks/useParticipants';
import { useUpdateParticipant } from '../features/participants/hooks/useUpdateParticipant';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { BackendParticipant, ParticipantChanges } from '../lib/api';
import { PERSON_FORMS, pluralizePl } from '../lib/pluralizePl';

const PAGE_SIZE = 10;
const SEARCH_DELAY_MS = 300;

function summaryOf(participants: BackendParticipant[], isSearching: boolean) {
  const people = pluralizePl(participants.length, PERSON_FORMS);

  if (isSearching) {
    return `Znaleziono: ${people}`;
  }

  const withConsent = participants.filter(
    (participant) => participant.consentAt !== null,
  ).length;

  return `${people} w bazie, ${withConsent} ze zgodą na kontakt`;
}

export default function ParticipantsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProjectExportOpen, setIsProjectExportOpen] = useState(false);
  const [editedParticipant, setEditedParticipant] =
    useState<BackendParticipant | null>(null);
  const [participantToDelete, setParticipantToDelete] =
    useState<BackendParticipant | null>(null);
  const searchedText = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const participantsQuery = useParticipants(searchedText);
  const createParticipant = useCreateParticipant();
  const updateParticipant = useUpdateParticipant();
  const deleteParticipant = useDeleteParticipant();
  const { exportNewsletter, isExporting } = useNewsletterExport();
  const isWideLayout = useMediaQuery('(min-width: 640px)');

  const participants = participantsQuery.data || [];
  const isSearching = searchedText !== '';
  const totalPages = Math.max(1, Math.ceil(participants.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  let listedParticipants = participants.slice(0, visibleCount);
  if (isWideLayout) {
    listedParticipants = participants.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE,
    );
  }

  const hasMore = !isWideLayout && visibleCount < participants.length;
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: !isWideLayout,
    hasMore,
    loadedCount: listedParticipants.length,
    onLoadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
  });

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    setVisibleCount(PAGE_SIZE);
  };

  const openAddForm = () => {
    setEditedParticipant(null);
    setIsFormOpen(true);
  };

  const openEditForm = (participant: BackendParticipant) => {
    setEditedParticipant(participant);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditedParticipant(null);
  };

  const afterSave = (message: string) => ({
    onSuccess: () => {
      closeForm();
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const submitParticipant = (values: ParticipantChanges) => {
    if (editedParticipant) {
      updateParticipant.mutate(
        { id: editedParticipant.id, changes: values },
        afterSave('Zmiany zapisane'),
      );
      return;
    }

    createParticipant.mutate(values, afterSave('Uczestnik dodany'));
  };

  const askToDelete = () => {
    setParticipantToDelete(editedParticipant);
    setIsFormOpen(false);
  };

  const cancelDelete = () => {
    setParticipantToDelete(null);
    setIsFormOpen(true);
  };

  const confirmDelete = () => {
    if (!participantToDelete) {
      return;
    }

    deleteParticipant.mutate(participantToDelete.id, {
      onSuccess: () => {
        setParticipantToDelete(null);
        setEditedParticipant(null);
        toast.success('Uczestnik usunięty');
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  let emptyMessage = 'Baza uczestników jest jeszcze pusta.';
  if (isSearching) {
    emptyMessage = `Nikt nie pasuje do „${searchedText}”.`;
  }

  let deleteDescription = '';
  if (participantToDelete) {
    deleteDescription = `Czy na pewno chcesz usunąć z bazy uczestników: ${participantToDelete.firstName} ${participantToDelete.lastName}?`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-dark 500:text-xl lg:text-2xl">
            Uczestnicy
          </h1>
          {participantsQuery.isSuccess && (
            <p className="mt-1 text-xs text-gray-500">
              {summaryOf(participants, isSearching)}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={() => void exportNewsletter()}
            isPending={isExporting}
            className="flex shrink-0 items-center gap-2 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs max-sm:px-2"
          >
            <HiOutlineDownload className="h-4 w-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Eksportuj do newslettera</span>
          </Button>
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={() => setIsProjectExportOpen(true)}
            className="flex shrink-0 items-center gap-2 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs max-sm:px-2"
          >
            <LuFolderDown className="h-4 w-4" aria-hidden="true" />
            <span className="max-sm:sr-only">Uczestnicy projektu</span>
          </Button>
          <Button
            variant="primary"
            size="small"
            type="button"
            onClick={openAddForm}
            className="flex shrink-0 items-center gap-2 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
          >
            <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
            Dodaj uczestnika
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <AiOutlineSearch
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          placeholder="Szukaj po imieniu, nazwisku lub mailu..."
          aria-label="Szukaj uczestników"
          className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
        />
      </div>

      {participantsQuery.isError ? (
        <div role="alert" className="flex items-center gap-3">
          <p className="text-xs text-darkRed">
            Nie udało się pobrać listy uczestników.
          </p>
          <button
            type="button"
            onClick={() => participantsQuery.refetch()}
            className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover"
          >
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <div key={currentPage} className="animate-fade-in overflow-hidden">
          <ParticipantsTable
            participants={listedParticipants}
            isLoading={participantsQuery.isLoading}
            emptyMessage={emptyMessage}
            onSelect={openEditForm}
          />
        </div>
      )}

      {isWideLayout ? (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      ) : (
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      )}

      {isFormOpen && (
        <ParticipantFormModal
          participant={editedParticipant || undefined}
          onClose={closeForm}
          onSubmit={submitParticipant}
          onDelete={editedParticipant ? askToDelete : undefined}
          isPending={createParticipant.isPending || updateParticipant.isPending}
        />
      )}

      {isProjectExportOpen && (
        <ProjectParticipantsExportModal
          onClose={() => setIsProjectExportOpen(false)}
        />
      )}

      <ConfirmDialog
        isOpen={participantToDelete !== null}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Usuń uczestnika"
        description={deleteDescription}
        confirmLabel="Usuń"
        tone="danger"
        isPending={deleteParticipant.isPending}
      />
    </div>
  );
}
