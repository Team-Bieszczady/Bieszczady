import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { HiOutlinePlus } from 'react-icons/hi';
import { AiOutlineSearch } from 'react-icons/ai';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PageMessage } from '../components/ui/PageMessage';
import { Select, type SelectOption } from '../components/ui/Select';
import Pagination from '../features/people/components/Pagination';
import { Spinner } from '../components/ui/Spinner';
import type { TaskStatus } from '../features/projects/types';
import { todayIso } from '../features/projects/utils/isoDate';
import { useProject } from '../features/projects/hooks/useProjectsApi';
import {
  useProjectTasks,
  type TaskResult,
} from '../features/tasks/hooks/useProjectTasks';
import TaskDetailModal from '../features/tasks/components/TaskDetailModal';
import TaskFormModal, {
  type TaskFormInputs,
} from '../features/tasks/components/TaskFormModal';
import TasksTable from '../features/tasks/components/TasksTable';
import TaskStatusTabs from '../features/tasks/components/TaskStatusTabs';
import {
  DEADLINE_FILTER_OPTIONS,
  PAGE_SIZE,
  PRIORITY_SELECT_OPTIONS,
  TASK_SORT_OPTIONS,
} from '../features/tasks/constants';
import type { TaskRow } from '../features/tasks/data';
import {
  EMPTY_TASK_FILTERS,
  countByStatus,
  filterAndSortTasks,
  type TaskFilters,
} from '../features/tasks/utils/filterAndSortTasks';
import {
  canChangeTaskStatus,
  canManageSubtasks,
  canManageTasks,
} from '../features/tasks/utils/taskPermissions';
import type { AuthenticatedUser } from '../lib/api';
import { useAuth } from '../context/useAuth';
import { useSelectedProject } from '../context/useSelectedProject';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

type TaskDialog =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'detail'; id: string }
  | { kind: 'edit'; row: TaskRow }
  | { kind: 'delete'; row: TaskRow };

const CLOSED: TaskDialog = { kind: 'none' };

function TasksView({
  projectId,
  user,
}: {
  projectId: string;
  user: AuthenticatedUser | null;
}) {
  const plan = useProjectTasks(projectId, user);
  const { data: project } = useProject(projectId);
  const today = todayIso();
  const [statusTab, setStatusTab] = useState<TaskStatus | null>(null);
  const [dialog, setDialog] = useState<TaskDialog>(CLOSED);
  const [page, setPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const isWideLayout = useMediaQuery('(min-width: 640px)');

  const { register, reset, control } = useForm<TaskFilters>({
    defaultValues: EMPTY_TASK_FILTERS,
  });
  const watchedFilters = useWatch({
    control,
    defaultValue: EMPTY_TASK_FILTERS,
  });
  const filters: TaskFilters = { ...EMPTY_TASK_FILTERS, ...watchedFilters };

  const close = () => setDialog(CLOSED);

  const reportQuietly = (result: TaskResult) => {
    if (!result.ok) toast.error(result.message, { id: result.message });
  };

  const report = (
    result: TaskResult,
    success: string,
    { keepOpen = false }: { keepOpen?: boolean } = {},
  ) => {
    if (!result.ok) {
      toast.error(result.message, { id: result.message });
      return;
    }
    if (!keepOpen) close();
    toast.success(success);

    if (result.autoClosed) {
      toast.success('Wszystkie zadania odhaczone — etap zamknięty');
    } else if (result.reopened) {
      toast.success('Etap wrócił do realizacji');
    }
  };

  const allRows = plan.rows;
  const isArchived = !!project?.archivedAt;
  const canEdit = !isArchived && canManageTasks(user, plan.members);
  const filteredRows = filterAndSortTasks(allRows, filters, today);
  const counts = countByStatus(filteredRows);
  const rows = statusTab
    ? filteredRows.filter((row) => row.status === statusTab)
    : filteredRows;

  const isFiltered =
    !!filters.search ||
    !!filters.owner ||
    !!filters.priority ||
    !!filters.deadline ||
    statusTab !== null;

  const filterKey = `${filters.search}|${filters.owner}|${filters.priority}|${filters.deadline}|${statusTab}`;
  const [previousFilterKey, setPreviousFilterKey] = useState(filterKey);
  if (previousFilterKey !== filterKey) {
    setPreviousFilterKey(filterKey);
    setPage(1);
    setVisibleCount(PAGE_SIZE);
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  if (page > totalPages) setPage(totalPages);

  const listedRows = isWideLayout
    ? rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : rows.slice(0, visibleCount);

  const hasMore = !isWideLayout && visibleCount < rows.length;
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: !isWideLayout,
    hasMore,
    loadedCount: listedRows.length,
    onLoadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
  });

  const { actionOptions, optionsForRow, ownerOptions } = plan;

  const toValues = (values: TaskFormInputs) => ({
    title: values.title,
    actionId: values.actionId,
    status: values.status,
    priority: values.priority || 'MEDIUM',
    dueDate: values.dueDate || null,
    ownerId: values.ownerId || null,
    description: values.description,
  });

  const requestAdd = () => {
    if (actionOptions.length === 0) {
      toast.error(
        'Brak działań w otwartych etapach — najpierw dodaj działanie w Harmonogramie.',
        { id: 'no-open-actions' },
      );
      return;
    }
    setDialog({ kind: 'add' });
  };

  const submitAdd = async (values: TaskFormInputs) => {
    report(await plan.addTask(toValues(values)), 'Zadanie dodane');
  };

  const submitEdit = async (row: TaskRow, values: TaskFormInputs) => {
    const moved = values.actionId !== row.actionId;
    report(
      await plan.editTask(row, toValues(values)),
      moved ? 'Zadanie przeniesione' : 'Zadanie zaktualizowane',
    );
  };

  const confirmDelete = async (row: TaskRow) => {
    report(await plan.deleteTask(row), 'Zadanie usunięte');
  };
  const detailRow =
    dialog.kind === 'detail'
      ? allRows.find((row) => row.id === dialog.id)
      : undefined;

  if (dialog.kind === 'detail' && !detailRow && !plan.isLoading)
    setDialog(CLOSED);

  const toggleDone = async (row: TaskRow) => {
    report(
      await plan.toggleTask(row),
      row.status === 'DONE'
        ? 'Zadanie wróciło do realizacji'
        : 'Zadanie oznaczone jako zrobione',
      { keepOpen: true },
    );
  };

  const FILTER_FIELDS: ReadonlyArray<{
    name: keyof TaskFilters;
    placeholder: string;
    options: readonly SelectOption[];
  }> = [
    { name: 'owner', placeholder: 'Osoba', options: ownerOptions },
    {
      name: 'priority',
      placeholder: 'Priorytet',
      options: PRIORITY_SELECT_OPTIONS,
    },
    {
      name: 'deadline',
      placeholder: 'Termin',
      options: DEADLINE_FILTER_OPTIONS,
    },
    { name: 'sort', placeholder: 'Sortuj', options: TASK_SORT_OPTIONS },
  ];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-base font-bold text-dark 500:text-xl lg:text-2xl">
          Zadania
        </h1>
        {canEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={requestAdd}
            className="flex items-center gap-2 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
          >
            <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
            Dodaj zadanie
          </Button>
        )}
      </div>

      <div className="mb-3">
        <div className="relative">
          <AiOutlineSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Wyszukaj zadanie..."
            className="h-10 w-full rounded-lg border border-gray-200 pr-4 pl-10 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
            {...register('search')}
          />
        </div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-3 gap-y-2 text-xs">
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
          className="flex cursor-pointer items-center gap-1 text-gray-500 transition-colors hover:text-dark"
          type="button"
          onClick={() => {
            reset(EMPTY_TASK_FILTERS);
            setStatusTab(null);
          }}
        >
          ✕ Wyczyść
        </button>
      </div>

      <TaskStatusTabs
        value={statusTab}
        counts={counts}
        total={filteredRows.length}
        onChange={setStatusTab}
      />

      {plan.isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex justify-center py-12"
        >
          <Spinner />
        </div>
      ) : (
        <div key={page} className="animate-fade-in overflow-hidden">
          <TasksTable
            rows={listedRows}
            today={today}
            canEdit={canEdit}
            emptyMessage={
              isFiltered && allRows.length > 0
                ? 'Brak zadań spełniających wybrane kryteria'
                : undefined
            }
            onAdd={requestAdd}
            onOpen={(row) => setDialog({ kind: 'detail', id: row.id })}
          />
        </div>
      )}

      {isWideLayout ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-3"
        />
      ) : (
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      )}

      {detailRow && (
        <TaskDetailModal
          row={detailRow}
          today={today}
          contextLabel={project?.name ?? detailRow.stageName}
          canEdit={canEdit}
          canDelete={canEdit}
          canComplete={
            !isArchived && canChangeTaskStatus(user, plan.members, detailRow)
          }
          canManageSubtasks={!isArchived && canManageSubtasks(user, detailRow)}
          onClose={close}
          onEdit={() => setDialog({ kind: 'edit', row: detailRow })}
          onDelete={() => setDialog({ kind: 'delete', row: detailRow })}
          onToggleDone={() => void toggleDone(detailRow)}
          onAddSubtask={(title) =>
            plan.addSubtask(detailRow.id, title).then(reportQuietly)
          }
          onRenameSubtask={(subtaskId, title) =>
            void plan.renameSubtask(subtaskId, title).then(reportQuietly)
          }
          onToggleSubtask={(subtaskId) => {
            const subtask = detailRow.subtasks.find(
              (entry) => entry.id === subtaskId,
            );
            if (!subtask) return;
            void plan
              .toggleSubtask(subtaskId, !subtask.done)
              .then(reportQuietly);
          }}
          onDeleteSubtask={(subtaskId) =>
            void plan
              .deleteSubtask(subtaskId)
              .then((result) =>
                report(result, 'Podzadanie usunięte', { keepOpen: true }),
              )
          }
        />
      )}

      {dialog.kind === 'add' && (
        <TaskFormModal
          mode="add"
          task={null}
          actionOptions={actionOptions}
          ownerOptions={ownerOptions}
          stageStartFor={plan.stageStartFor}
          onClose={close}
          onSubmit={(values) => void submitAdd(values)}
          isSubmitting={plan.isSubmitting}
        />
      )}

      {dialog.kind === 'edit' && (
        <TaskFormModal
          mode="edit"
          task={dialog.row}
          actionOptions={optionsForRow(dialog.row)}
          ownerOptions={ownerOptions}
          stageStartFor={plan.stageStartFor}
          onClose={close}
          onSubmit={(values) => void submitEdit(dialog.row, values)}
          isSubmitting={plan.isSubmitting}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.kind === 'delete'}
        onClose={close}
        onConfirm={() => {
          if (dialog.kind === 'delete') void confirmDelete(dialog.row);
        }}
        title="Usuń zadanie"
        description={
          <>
            Czy na pewno chcesz usunąć zadanie „
            {dialog.kind === 'delete' ? dialog.row.title : ''}”? Tej operacji
            nie można cofnąć.
          </>
        }
        confirmLabel="Usuń"
        tone="danger"
      />
    </>
  );
}

export default function ProjectTasksPage() {
  const { projectId } = useSelectedProject();
  const { user } = useAuth();

  if (!projectId) {
    return (
      <PageMessage message="Nie wybrano projektu. Wybierz go na liście projektów." />
    );
  }

  return (
    <div className="px-4 min-[400px]:px-6 sm:px-8 pt-16 pb-4 lg:pt-4 max-w-7xl mx-auto">
      <TasksView projectId={projectId} user={user} />
    </div>
  );
}
