import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { HiOutlinePlus } from 'react-icons/hi';
import { AiOutlineSearch } from 'react-icons/ai';
import { Button } from '../components/ui/Button';
import { Select, type SelectOption } from '../components/ui/Select';
import { QueryState } from '../components/ui/QueryState';
import NotificationBell from '../features/notifications/components/NotificationBell';
import AddProjectModal from '../features/projects/components/AddProjectModal';
import ProjectCard from '../features/projects/components/ProjectCard';
import {
  useProjects,
  useProjectStatuses,
} from '../features/projects/hooks/useProjectsApi';
import { PROJECT_SORT_OPTIONS } from '../features/projects/constants';
import {
  EMPTY_PROJECT_FILTERS,
  filterAndSortProjects,
  type ProjectFilters,
} from '../features/projects/utils/filterAndSortProjects';
import type { BackendProjectCard } from '../lib/projectsApi';
import { useAuth } from '../context/useAuth';

interface ProjectsListProps {
  projects: BackendProjectCard[];
  statusOptions: readonly SelectOption[];
  canEdit: boolean;
}

function ProjectsList({ projects, statusOptions, canEdit }: ProjectsListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { register, reset, control } = useForm<ProjectFilters>({
    defaultValues: EMPTY_PROJECT_FILTERS,
  });
  const watchedFilters = useWatch({
    control,
    defaultValue: EMPTY_PROJECT_FILTERS,
  });
  const filters: ProjectFilters = {
    ...EMPTY_PROJECT_FILTERS,
    ...watchedFilters,
  };
  const visibleProjects = filterAndSortProjects(projects, filters);
  const isFiltered = !!filters.search || !!filters.status;
  const inProgress = projects.filter(
    (project) => project.progress < 100,
  ).length;

  const filterFields: ReadonlyArray<{
    name: keyof ProjectFilters;
    placeholder: string;
    options: readonly SelectOption[];
  }> = [
    { name: 'status', placeholder: 'Status', options: statusOptions },
    { name: 'sort', placeholder: 'Sortuj', options: PROJECT_SORT_OPTIONS },
  ];

  return (
    <div className="px-5 min-[400px]:px-6 sm:px-8 pt-20 pb-8 lg:pt-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-3 500:gap-4">
        <h1 className="flex items-baseline gap-1.5 text-base font-bold text-dark 500:gap-2 500:text-xl lg:text-2xl">
          Projekty w toku:
          <span className="text-base font-medium text-darkGreen 500:text-xl">
            {inProgress}
          </span>
          <span className="text-sm font-medium text-dark/50 500:text-lg">
            /{projects.length}
          </span>
        </h1>

        <div className="flex items-center gap-3">
          <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-end border-b border-gray-200 bg-white px-5 lg:static lg:h-auto lg:border-0 lg:bg-transparent lg:px-0">
            <NotificationBell />
          </div>
          {canEdit && (
            <Button
              variant="primary"
              size="small"
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 max-lg:gap-1.5 max-lg:px-4 max-lg:text-xs"
            >
              <HiOutlinePlus className="h-4 w-4" />
              Dodaj projekt
            </Button>
          )}
        </div>
      </div>

      <div className="mb-3">
        <div className="relative">
          <AiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Wyszukaj po nazwie lub opisie..."
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
          onClick={() => reset(EMPTY_PROJECT_FILTERS)}
        >
          ✕ Wyczyść
        </button>
      </div>

      {isFiltered && (
        <p className="mb-4 text-xs text-grayText">
          Znaleziono {visibleProjects.length} z {projects.length}
        </p>
      )}

      {visibleProjects.length === 0 ? (
        <p className="py-12 text-center text-sm text-grayText">
          {projects.length === 0
            ? 'Brak projektów'
            : 'Brak projektów spełniających kryteria'}
        </p>
      ) : (
        <div className="animate-fade-in grid gap-4 min-[400px]:gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              canManage={canEdit}
            />
          ))}
        </div>
      )}

      <AddProjectModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const projectsQuery = useProjects();
  const statusesQuery = useProjectStatuses();

  const statusOptions: SelectOption[] = (statusesQuery.data ?? []).map(
    (status) => ({ value: status.id, label: status.name }),
  );

  return (
    <QueryState
      isLoading={projectsQuery.isLoading}
      isError={projectsQuery.isError}
      error={projectsQuery.error}
      data={projectsQuery.data}
      errorMessage="Nie udało się pobrać listy projektów."
      notFoundMessage="Brak projektów."
      refetch={() => void projectsQuery.refetch()}
    >
      {(projects) => (
        <ProjectsList
          projects={projects}
          statusOptions={statusOptions}
          canEdit={!!user?.isDirector}
        />
      )}
    </QueryState>
  );
}
