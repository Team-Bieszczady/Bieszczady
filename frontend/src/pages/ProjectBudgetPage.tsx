import { useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import { PageLoading } from '../components/ui/PageLoading';
import { PageMessage } from '../components/ui/PageMessage';
import { useAuth } from '../context/useAuth';
import { useSelectedProject } from '../context/useSelectedProject';
import { hasModule } from '../lib/modules';
import { openAnnex } from '../features/budget/budgetReducer';
import { BudgetHistoryModal } from '../features/budget/components/BudgetHistoryModal';
import { BudgetSummary } from '../features/budget/components/BudgetSummary';
import { BudgetTable } from '../features/budget/components/BudgetTable';
import { BudgetVersionTabs } from '../features/budget/components/BudgetVersionTabs';
import { VersionBanner } from '../features/budget/components/VersionBanner';
import { useBudget, useBudgetAction } from '../features/budget/hooks/useBudget';
import {
  currentVersion,
  diffVersions,
  previousVersion,
} from '../features/budget/utils/budgetTotals';
import { useFolders } from '../features/documents/hooks/useFolders';
import { collectAncestorIds } from '../features/documents/utils/folderTree';

export default function ProjectBudgetPage() {
  const { projectId } = useSelectedProject();

  if (!projectId) {
    return (
      <PageMessage message="Nie wybrano projektu. Wybierz go na liście projektów." />
    );
  }

  return <BudgetView projectId={projectId} />;
}

function BudgetView({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const budgetQuery = useBudget(projectId);
  const budgetAction = useBudgetAction(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showChanges, setShowChanges] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const canOpenDocuments = hasModule(user, 'DOCUMENTS');
  const foldersQuery = useFolders(projectId, canOpenDocuments);
  const folders = foldersQuery.data ?? [];
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const folderPaths = canOpenDocuments
    ? new Map(
        folders.map((folder) => [
          folder.id,
          [...collectAncestorIds(folders, folder.id)]
            .reverse()
            .map((id) => folderById.get(id)?.name ?? '')
            .join(' / '),
        ]),
      )
    : null;

  if (!budgetQuery.data) {
    return budgetQuery.isError ? (
      <PageMessage
        message="Nie udało się wczytać budżetu."
        onRetry={() => void budgetQuery.refetch()}
      />
    ) : (
      <PageLoading />
    );
  }

  const store = budgetQuery.data;
  const active =
    store.versions.find((version) => version.id === activeId) ??
    currentVersion(store);
  const previous = previousVersion(store, active);
  const diff = previous
    ? diffVersions(previous.categories, active.categories)
    : null;
  const pendingAnnex = openAnnex(store);
  const dispatch = budgetAction.mutate;

  const createAnnex = () => {
    if (pendingAnnex) {
      setActiveId(pendingAnnex.id);
      return;
    }
    const id = crypto.randomUUID();
    dispatch({ type: 'CREATE_ANNEX', id });
    setActiveId(id);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-20 pb-8 min-[400px]:px-6 sm:px-8 lg:pt-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-base font-bold text-dark 500:text-xl lg:text-2xl">
          Budżet
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="small"
            onClick={() => setShowHistory(true)}
            className="max-lg:h-7 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
          >
            Historia zmian
          </Button>
          <Button
            variant="primary"
            size="small"
            onClick={createAnnex}
            className="flex items-center gap-2 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
          >
            {!pendingAnnex && (
              <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
            )}
            {pendingAnnex ? `Przejdź do: ${pendingAnnex.name}` : 'Utwórz aneks'}
          </Button>
        </div>
      </div>
      <BudgetVersionTabs
        versions={store.versions}
        activeId={active.id}
        onChange={setActiveId}
        showChanges={showChanges}
        canShowChanges={previous !== null}
        onToggleChanges={() => setShowChanges((value) => !value)}
      />
      <VersionBanner
        key={active.id}
        store={store}
        version={active}
        previous={previous}
        diff={diff}
        dispatch={dispatch}
      />
      <BudgetSummary
        categories={active.categories}
        columns={store.columns}
        actuals={store.actuals}
      />
      <BudgetTable
        key={active.id}
        projectId={projectId}
        store={store}
        version={active}
        previous={previous}
        diff={showChanges ? diff : null}
        folderPaths={folderPaths}
        dispatch={dispatch}
      />
      {showHistory && (
        <BudgetHistoryModal
          store={store}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
