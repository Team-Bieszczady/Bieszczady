import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import { AiOutlineSearch } from 'react-icons/ai';
import { IoCloseOutline } from 'react-icons/io5';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Select, type SelectOption } from '../components/ui/Select';
import Pagination from '../features/people/components/Pagination';
import PartnersTable from '../features/partners/components/PartnersTable';
import PartnerDetailsModal from '../features/partners/components/PartnerDetailsModal';
import PartnerFormModal from '../features/partners/components/PartnerFormModal';
import {
  useDeletePartner,
  usePartners,
} from '../features/partners/hooks/usePartners';
import {
  AGREEMENT_OPTIONS,
  PARTNER_STATUS_OPTIONS,
  PARTNER_TYPE_OPTIONS,
} from '../features/partners/constants';
import {
  EMPTY_FILTERS,
  filterPartners,
  type PartnerFilters,
} from '../features/partners/utils/filterPartners';
import type { Partner } from '../features/partners/data';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const PAGE_SIZE = 6;

export default function PartnersPage() {
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [openedPartner, setOpenedPartner] = useState<Partner | null>(null);
  const [formPartner, setFormPartner] = useState<Partner | null | undefined>();
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null);
  const { data: partners = [], isLoading } = usePartners();
  const deletePartner = useDeletePartner();
  const isWideLayout = useMediaQuery('(min-width: 640px)');
  const { register, reset, control } = useForm<PartnerFilters>({
    defaultValues: EMPTY_FILTERS,
  });
  const watchedFilters = useWatch({ control, defaultValue: EMPTY_FILTERS });
  const filters: PartnerFilters = { ...EMPTY_FILTERS, ...watchedFilters };
  const visiblePartners = filterPartners(partners, filters);

  const projectOptions: SelectOption[] = partners
    .flatMap((partner) => partner.projects)
    .filter(
      (project, index, all) =>
        all.findIndex(({ id }) => id === project.id) === index,
    )
    .map((project) => ({ value: project.id, label: project.name }));

  const filterFields: ReadonlyArray<{
    name: Exclude<keyof PartnerFilters, 'search'>;
    placeholder: string;
    options: readonly SelectOption[];
  }> = [
    { name: 'type', placeholder: 'Typ', options: PARTNER_TYPE_OPTIONS },
    { name: 'status', placeholder: 'Status', options: PARTNER_STATUS_OPTIONS },
    { name: 'projectId', placeholder: 'Projekt', options: projectOptions },
    { name: 'agreement', placeholder: 'Umowa', options: AGREEMENT_OPTIONS },
  ];

  const isFiltered = Object.values(filters).some(Boolean);

  const totalPages = Math.max(1, Math.ceil(visiblePartners.length / PAGE_SIZE));
  const filterKey = Object.values(filters).join('|');
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  if (previousFilterKey !== filterKey) {
    setPreviousFilterKey(filterKey);
    setPage(1);
    setVisibleCount(PAGE_SIZE);
  }

  if (page > totalPages) setPage(totalPages);

  const listedPartners = isWideLayout
    ? visiblePartners.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : visiblePartners.slice(0, visibleCount);

  const hasMore = !isWideLayout && visibleCount < visiblePartners.length;
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: !isWideLayout,
    hasMore,
    loadedCount: listedPartners.length,
    onLoadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
  });

  const openEdit = (partner: Partner) => {
    setOpenedPartner(null);
    setFormPartner(partner);
  };

  const openDelete = (partner: Partner) => {
    setOpenedPartner(null);
    setDeletingPartner(partner);
  };

  const confirmDelete = () => {
    if (!deletingPartner) return;
    deletePartner.mutate(deletingPartner.id, {
      onSuccess: () => {
        toast.success('Usunięto partnera');
        setDeletingPartner(null);
      },
    });
  };

  return (
    <div className="px-4 min-[400px]:px-6 sm:px-8 pt-20 pb-8 lg:pt-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-bold text-dark 500:text-xl lg:text-2xl">
          Partnerzy
        </h1>
        <Button
          variant="primary"
          size="small"
          onClick={() => setFormPartner(null)}
          className="flex items-center gap-2 max-lg:h-7 max-lg:px-4 max-lg:py-1 max-lg:text-xs max-lg:gap-1.5"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Dodaj partnera
        </Button>
      </div>

      <div className="mb-3">
        <div className="relative">
          <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Wyszukaj partnera, osobę kontaktową lub NIP..."
            className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-darkGreen focus:border-transparent"
            {...register('search')}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 gap-y-2 mb-4 text-xs">
        <span className="font-medium text-dark">Filtruj:</span>
        {filterFields.map(({ name, placeholder, options }) => (
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
          <IoCloseOutline aria-hidden="true" />
          Wyczyść
        </button>
      </div>

      <div key={page} className="overflow-hidden animate-fade-in">
        <PartnersTable
          partners={listedPartners}
          isLoading={isLoading}
          onOpen={setOpenedPartner}
          onEdit={openEdit}
          onDelete={openDelete}
          onAdd={() => setFormPartner(null)}
          emptyMessage={
            isFiltered && partners.length > 0
              ? 'Brak partnerów spełniających wybrane kryteria'
              : undefined
          }
        />
      </div>

      {isWideLayout ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-6"
        />
      ) : (
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      )}

      <PartnerDetailsModal
        partner={openedPartner}
        onClose={() => setOpenedPartner(null)}
        onEdit={openEdit}
        onDelete={openDelete}
      />

      {formPartner !== undefined && (
        <PartnerFormModal
          key={formPartner?.id ?? 'new'}
          partner={formPartner ?? undefined}
          onClose={() => setFormPartner(undefined)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingPartner}
        onClose={() => setDeletingPartner(null)}
        onConfirm={confirmDelete}
        title="Usuń partnera"
        description={
          <>
            Czy na pewno chcesz usunąć partnera{' '}
            <span className="font-semibold">{deletingPartner?.name}</span>?
          </>
        }
        confirmLabel="Usuń"
        tone="danger"
        isPending={deletePartner.isPending}
      />
    </div>
  );
}
