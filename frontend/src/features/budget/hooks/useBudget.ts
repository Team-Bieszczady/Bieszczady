import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../context/useAuth';
import {
  budgetReducer,
  canApproveAnnexes,
  type BudgetAction,
} from '../budgetReducer';
import { INITIAL_STORE } from '../data';
import type { BudgetStore } from '../types';

const budgetKey = (projectId: string) => ['budget', projectId];

export function useBudget(projectId: string) {
  return useQuery({
    queryKey: budgetKey(projectId),
    queryFn: async () => INITIAL_STORE,
    staleTime: Infinity,
  });
}

export function useBudgetAction(projectId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (action: BudgetAction) => action,
    onSuccess: (action) => {
      queryClient.setQueryData<BudgetStore>(budgetKey(projectId), (store) =>
        store
          ? budgetReducer(store, action, {
              actor: {
                id: user?.id ?? '',
                name: user ? `${user.firstName} ${user.lastName}` : '',
              },
              canApprove: canApproveAnnexes(user),
              at: new Date().toISOString(),
            })
          : store,
      );
    },
  });
}
