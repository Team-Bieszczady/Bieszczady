import { useReducer } from 'react';
import { budgetReducer } from '../features/budget/budgetReducer';
import { BudgetSummary } from '../features/budget/components/BudgetSummary';
import { BudgetTable } from '../features/budget/components/BudgetTable';
import { INITIAL_BUDGET } from '../features/budget/data';

export default function ProjectBudgetPage() {
  const [state, dispatch] = useReducer(budgetReducer, INITIAL_BUDGET);

  return (
    <div className="px-4 min-[400px]:px-6 sm:px-8 pt-20 pb-8 lg:pt-4 max-w-7xl mx-auto">
      <h1 className="mb-6 text-base font-bold text-dark 500:text-xl lg:text-2xl">
        Budżet
      </h1>
      <BudgetSummary state={state} />
      <BudgetTable state={state} dispatch={dispatch} />
    </div>
  );
}
