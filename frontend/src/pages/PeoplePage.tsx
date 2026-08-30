import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { HiOutlinePlus } from 'react-icons/hi';
import { AiOutlineSearch } from 'react-icons/ai';
import { Button } from '../components/ui/Button';
import { Select, type SelectOption } from '../components/ui/Select';
import PeopleTable from '../features/people/components/PeopleTable';
import AddUserModal from '../features/people/components/AddUserModal';
import Pagination from '../features/people/components/Pagination';
import { usePeople } from '../features/people/hooks/usePeople';
import {
  PROJECT_SELECT_OPTIONS,
  ROLE_FILTER_SELECT_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
} from '../features/people/constants';
import {
  EMPTY_FILTERS,
  filterAndSortPeople,
  type PeopleFilters,
} from '../features/people/utils/filterAndSortPeople';
import { useAuth } from '../context/useAuth';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const FILTER_FIELDS: ReadonlyArray<{
  name: keyof PeopleFilters;
  placeholder: string;
  options: readonly SelectOption[];
}> = [
  { name: 'role', placeholder: 'Rola', options: ROLE_FILTER_SELECT_OPTIONS },
  { name: 'status', placeholder: 'Konto', options: STATUS_OPTIONS },
  { name: 'projectId', placeholder: 'Projekt', options: PROJECT_SELECT_OPTIONS },
  { name: 'sort', placeholder: 'Sortuj', options: SORT_OPTIONS },
];

const PAGE_SIZE = 6;

export default function PeoplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data: people = [], isLoading } = usePeople();
  const { user } = useAuth();
  const isWideLayout = useMediaQuery('(min-width: 640px)');
  const { register, reset, control } = useForm<PeopleFilters>({
    defaultValues: EMPTY_FILTERS,
  });
  const watchedFilters = useWatch({ control, defaultValue: EMPTY_FILTERS });
  const filters: PeopleFilters = { ...EMPTY_FILTERS, ...watchedFilters };
  const visiblePeople = filterAndSortPeople(people, filters);

  const isFiltered =
    !!filters.search ||
    !!filters.role ||
    !!filters.status ||
    !!filters.projectId;

  const totalPages = Math.max(1, Math.ceil(visiblePeople.length / PAGE_SIZE));
  const filterKey = `${filters.search}|${filters.role}|${filters.status}|${filters.projectId}`;
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  if (previousFilterKey !== filterKey) {
    setPreviousFilterKey(filterKey);
    setPage(1);
    setVisibleCount(PAGE_SIZE);
  }

  const listedPeople = isWideLayout
    ? visiblePeople.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : visiblePeople.slice(0, visibleCount);

  const hasMore = !isWideLayout && visibleCount < visiblePeople.length;
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: !isWideLayout,
    hasMore,
    loadedCount: listedPeople.length,
    onLoadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
  });

  return (
    <div className="px-4 min-[400px]:px-6 sm:px-8 pt-20 pb-8 lg:pt-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-dark">Ludzie</h1>
        {user?.isDirector && (
          <Button
            variant="primary"
            size="small"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 max-lg:h-7 max-lg:px-4 max-lg:py-1 max-lg:text-xs max-lg:gap-1.5"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Dodaj użytkownika
          </Button>
        )}
      </div>

      <div className="mb-3">
        <div className="relative">
          <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Wyszukaj po imieniu i nazwisku..."
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-darkGreen focus:border-transparent"
            {...register('search')}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 gap-y-2 mb-4 text-xs">
        <span className="font-medium text-dark">Filtruj:</span>
        {FILTER_FIELDS.map(({ name, placeholder, options }) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <Select
                placeholder={placeholder}
                options={options}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        ))}
        <button
          className="flex items-center gap-1 text-gray-500 hover:text-dark transition-colors cursor-pointer"
          type="button"
          onClick={() => reset(EMPTY_FILTERS)}
        >
          ✕ Wyczyść
        </button>
      </div>

      <div key={page} className="overflow-hidden animate-fade-in">
        <PeopleTable
          people={listedPeople}
          isLoading={isLoading}
          onAddUser={() => setIsModalOpen(true)}
          canAddUser={!!user?.isDirector}
          emptyMessage={
            isFiltered && people.length > 0
              ? 'Brak osób spełniających wybrane kryteria'
              : undefined
          }
        />
      </div>

      {isWideLayout ? (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      ) : (
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      )}

      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
