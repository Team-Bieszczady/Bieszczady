import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import { Button } from '../components/ui/Button';
import {
  budgetReducer,
  type BudgetAction,
} from '../features/budget/budgetReducer';
import { BudgetSummary } from '../features/budget/components/BudgetSummary';
import { BudgetTable } from '../features/budget/components/BudgetTable';
import { BudgetVersionTabs } from '../features/budget/components/BudgetVersionTabs';
import { INITIAL_VERSIONS } from '../features/budget/data';

export default function ProjectBudgetPage() {
  const [versions, setVersions] = useState(INITIAL_VERSIONS);
  const [activeId, setActiveId] = useState(INITIAL_VERSIONS[0].id);
  const active =
    versions.find((version) => version.id === activeId) ?? versions[0];

  const dispatch = (action: BudgetAction) =>
    setVersions((current) =>
      current.map((version) =>
        version.id === active.id
          ? { ...version, budget: budgetReducer(version.budget, action) }
          : version,
      ),
    );

  const saveAnnex = () => {
    const id = crypto.randomUUID();
    setVersions((current) => [
      ...current,
      { id, label: `Aneks ${current.length}`, budget: active.budget },
    ]);
    setActiveId(id);
    toast.success('Nowy aneks zapisany');
  };

  return (
    <div className="px-4 min-[400px]:px-6 sm:px-8 pt-20 pb-8 lg:pt-4 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-base font-bold text-dark 500:text-xl lg:text-2xl">
          Budżet
        </h1>
        <Button
          variant="primary"
          size="small"
          onClick={saveAnnex}
          className="flex items-center gap-2 max-lg:h-7 max-lg:gap-1.5 max-lg:px-4 max-lg:py-1 max-lg:text-xs"
        >
          <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
          Zapisz nowy aneks
        </Button>
      </div>
      <BudgetVersionTabs
        versions={versions}
        activeId={active.id}
        onChange={setActiveId}
      />
      <BudgetSummary state={active.budget} />
      <BudgetTable key={active.id} state={active.budget} dispatch={dispatch} />
    </div>
  );
}
