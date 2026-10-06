import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { HiOutlinePlus } from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import { FilterBar, type FilterField } from '../components/ui/FilterBar';
import { Spinner } from '../components/ui/Spinner';
import AddDecisionModal from '../features/decisions/components/AddDecisionModal';
import DecisionHistoryList from '../features/decisions/components/DecisionHistoryList';
import { PERIOD_FILTER_OPTIONS } from '../features/decisions/constants';
import { useEvents } from '../features/decisions/hooks/useEventsApi';
import {
  EMPTY_DECISION_FILTERS,
  groupByDay,
  periodToFrom,
  type DecisionFilters,
} from '../features/decisions/utils/decisionHistory';
import { useProjects } from '../features/projects/hooks/useProjectsApi';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export default function DecisionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { reset, control } = useForm<DecisionFilters>({
    defaultValues: EMPTY_DECISION_FILTERS,
  });
  const watchedFilters = useWatch({
    control,
    defaultValue: EMPTY_DECISION_FILTERS,
  });
  const filters: DecisionFilters = {
    ...EMPTY_DECISION_FILTERS,
    ...watchedFilters,
  };

  const events = useEvents(filters.project, periodToFrom(filters.period));
  const listedEvents = events.data?.pages.flatMap((page) => page.items) ?? [];
  const groups = groupByDay(listedEvents);
  const isFiltered = !!filters.project || !!filters.period;
  const projects = useProjects();
  const projectOptions = (projects.data ?? [])
    .map((project) => ({ value: project.id, label: project.name }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pl'));

  const FILTER_FIELDS: ReadonlyArray<FilterField<DecisionFilters>> = [
    { name: 'project', placeholder: 'Projekt', options: projectOptions },
    { name: 'period', placeholder: 'Okres', options: PERIOD_FILTER_OPTIONS },
  ];

  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: !events.isFetchingNextPage,
    hasMore: events.hasNextPage,
    loadedCount: listedEvents.length,
    onLoadMore: () => void events.fetchNextPage(),
  });

  return (
    <div className="px-4 min-[400px]:px-6 sm:px-8 pt-20 pb-4 lg:pt-4 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-base font-bold text-dark 500:text-xl lg:text-2xl">
          Decyzje
        </h1>
        <Button
          variant="primary"
          size="small"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
        >
          <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
          Dodaj decyzję
        </Button>
      </div>

      <FilterBar
        fields={FILTER_FIELDS}
        control={control}
        onClear={() => reset(EMPTY_DECISION_FILTERS)}
        className="mb-4"
      />

      {events.isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex justify-center py-12"
        >
          <Spinner variant="dark" size="32" />
        </div>
      ) : events.isError ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-sm text-gray-500">{events.error.message}</p>
          <Button
            variant="outline"
            size="compact"
            onClick={() => void events.refetch()}
          >
            Spróbuj ponownie
          </Button>
        </div>
      ) : (
        <div className="animate-fade-in">
          <DecisionHistoryList
            groups={groups}
            emptyMessage={
              isFiltered
                ? 'Brak decyzji spełniających wybrane kryteria'
                : undefined
            }
          />
        </div>
      )}

      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      <AddDecisionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
