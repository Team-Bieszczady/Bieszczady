import { failure, type ActionFailure } from '../../../lib/actionResult';
import type { RiskLevelValue } from '../../../lib/projectsApi';
import {
  useCreateRisk,
  useDeleteRisk,
  useRisks,
  useUpdateRisk,
} from './useProjectsApi';

export interface RiskView {
  id: string;
  description: string;
  probability: RiskLevelValue;
  impact: RiskLevelValue;
  responsibleUserId: string | null;
  owner: string | null;
}

export interface RiskFormValues {
  description: string;
  probability: RiskLevelValue;
  impact: RiskLevelValue;
  responsibleUserId: string | null;
}

export type RiskResult = { ok: true } | ActionFailure;

export function useProjectRisks(projectId: string) {
  const query = useRisks(projectId);
  const createRisk = useCreateRisk(projectId);
  const updateRisk = useUpdateRisk(projectId);
  const removeRisk = useDeleteRisk(projectId);

  const risks: RiskView[] = (query.data ?? []).map((risk) => ({
    id: risk.id,
    description: risk.description,
    probability: risk.probability,
    impact: risk.impact,
    responsibleUserId: risk.responsibleUserId,
    owner: risk.responsible
      ? `${risk.responsible.firstName} ${risk.responsible.lastName}`
      : null,
  }));

  const addRisk = async (values: RiskFormValues): Promise<RiskResult> => {
    try {
      await createRisk.mutateAsync(values);
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się dodać ryzyka');
    }
  };

  const editRisk = async (
    id: string,
    values: RiskFormValues,
  ): Promise<RiskResult> => {
    try {
      await updateRisk.mutateAsync({ id, ...values });
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się zapisać ryzyka');
    }
  };

  const deleteRisk = async (id: string): Promise<RiskResult> => {
    try {
      await removeRisk.mutateAsync(id);
      return { ok: true };
    } catch (error) {
      return failure(error, 'Nie udało się usunąć ryzyka');
    }
  };

  return {
    risks,
    isLoading: query.isLoading,
    addRisk,
    editRisk,
    deleteRisk,
  };
}
