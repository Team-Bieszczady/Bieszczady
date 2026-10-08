import { useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import Pagination from '../features/people/components/Pagination';
import ParticipantsTable from '../features/participants/components/ParticipantsTable';
import { useParticipants } from '../features/participants/hooks/useParticipants';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { BackendParticipant } from '../lib/api';
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
  const searchedText = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);
  const participantsQuery = useParticipants(searchedText);
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

  let emptyMessage = 'Baza uczestników jest jeszcze pusta.';
  if (isSearching) {
    emptyMessage = `Nikt nie pasuje do „${searchedText}”.`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <div className="mb-6">
        <h1 className="text-base font-bold text-dark min-[500px]:text-xl lg:text-2xl">
          Uczestnicy
        </h1>
        {participantsQuery.isSuccess && (
          <p className="mt-1 text-xs text-gray-500">
            {summaryOf(participants, isSearching)}
          </p>
        )}
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
    </div>
  );
}
