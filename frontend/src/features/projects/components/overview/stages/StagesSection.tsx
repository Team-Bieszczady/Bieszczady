import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../../components/ui/ConfirmDialog';
import type { SelectOption } from '../../../../../components/ui/Select';
import { Spinner } from '../../../../../components/ui/Spinner';
import type { BackendProject } from '../../../../../lib/projectsApi';
import type { Stage } from '../../../types';
import type { DeleteStrategy } from '../../../types';
import type {
  ProjectPlanApi,
  StageResult,
} from '../../../hooks/useProjectPlanApi';
import { describeStage } from '../../../utils/stageState';
import {
  STAGE_ISSUE_MESSAGES,
  type StageShiftSuggestion,
} from '../../../utils/stageRules';
import EmptySectionState from '../EmptySectionState';
import OverviewSection from '../OverviewSection';
import TimelineCard from '../TimelineCard';
import ArchivedStagesPanel from './ArchivedStagesPanel';
import DeleteCompletedStageDialog from './DeleteCompletedStageDialog';
import DeleteStageModal from './DeleteStageModal';
import MoveDeadlineModal from './MoveDeadlineModal';
import ShiftFollowingStagesDialog from './ShiftFollowingStagesDialog';
import StageCard from './StageCard';
import StageFormModal, { type StageFormInputs } from './StageFormModal';

interface StagesSectionProps {
  plan: ProjectPlanApi;
  project: BackendProject;
  canEdit: boolean;
}

type StageDialog =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; stage: Stage }
  | { kind: 'move-deadline'; stage: Stage }
  | {
      kind: 'shift-following';
      stageName: string;
      shiftDays: number;
      suggestions: StageShiftSuggestion[];
    }
  | { kind: 'archive'; stage: Stage }
  | { kind: 'delete-empty'; stage: Stage }
  | { kind: 'delete-content'; stage: Stage }
  | { kind: 'delete-completed'; stage: Stage };

const CLOSED: StageDialog = { kind: 'none' };

function toOptions(stages: Stage[]): SelectOption[] {
  return stages.map((stage) => ({ value: stage.id, label: stage.name }));
}

export default function StagesSection({
  plan,
  project,
  canEdit,
}: StagesSectionProps) {
  const [dialog, setDialog] = useState<StageDialog>(CLOSED);

  const close = () => setDialog(CLOSED);

  const reportFailure = (result: Extract<StageResult, { ok: false }>) => {
    const message =
      'issue' in result ? STAGE_ISSUE_MESSAGES[result.issue] : result.message;
    toast.error(message, { id: message });
  };

  const active = plan.activeStages;
  const views = active.map((stage) =>
    describeStage(stage, plan.countsFor(stage.id), plan.today),
  );
  const requestDelete = (stage: Stage) => {
    if (stage.completedAt && stage.archivedAt === null) {
      setDialog({ kind: 'delete-completed', stage });
      return;
    }
    if (plan.countsFor(stage.id).actions === 0) {
      setDialog({ kind: 'delete-empty', stage });
      return;
    }
    setDialog({ kind: 'delete-content', stage });
  };

  const submitAdd = async (values: StageFormInputs) => {
    const result = await plan.addStage({
      name: values.name,
      description: values.description,
      startDate: values.startDate || null,
      deadline: values.deadline,
    });

    if (!result.ok) return reportFailure(result);
    close();
    toast.success('Etap dodany');
  };

  const submitEdit = async (stage: Stage, values: StageFormInputs) => {
    const result = await plan.editStage(stage.id, {
      name: values.name,
      description: values.description,
    });

    if (!result.ok) return reportFailure(result);
    close();
    toast.success('Etap zaktualizowany');
  };

  const submitMoveDeadline = async (
    stage: Stage,
    deadline: string,
    note: string,
  ) => {
    const result = await plan.moveDeadline(stage.id, deadline, note);

    if (!result.ok) {
      const message = result.issue
        ? STAGE_ISSUE_MESSAGES[result.issue]
        : (result.message ?? STAGE_ISSUE_MESSAGES.notFound);
      return toast.error(message, { id: message });
    }

    toast.success('Termin etapu przeniesiony');

    if (result.suggestions.length > 0) {
      const shiftDays = Math.round(
        (new Date(deadline).getTime() - new Date(stage.deadline).getTime()) /
          86_400_000,
      );
      setDialog({
        kind: 'shift-following',
        stageName: stage.name,
        shiftDays,
        suggestions: result.suggestions,
      });
      return;
    }
    close();
  };

  const applyShift = async (
    suggestions: StageShiftSuggestion[],
    sourceStageName: string,
  ) => {
    const result = await plan.applyFollowingStageShifts(
      suggestions,
      sourceStageName,
    );
    if (!result.ok) return reportFailure(result);

    close();
    toast.success('Terminy kolejnych etapów przesunięte');
  };

  const confirmArchive = async (stage: Stage) => {
    const result = await plan.archiveStage(stage.id);
    if (!result.ok) return reportFailure(result);

    close();
    toast.success('Etap zarchiwizowany');
  };

  const restore = async (stage: Stage) => {
    const result = await plan.restoreStage(stage.id);
    if (!result.ok) return reportFailure(result);

    toast.success('Etap przywrócony');
  };

  const confirmDelete = async (stage: Stage, strategy: DeleteStrategy) => {
    const result = await plan.deleteStage(stage.id, strategy);
    if (!result.ok) return reportFailure(result);

    close();
    toast.success('Etap został usunięty');
  };

  const contentCounts = (stage: Stage) => {
    const counts = plan.countsFor(stage.id);
    return {
      actionsCount: counts.actions,
      tasksCount: counts.total,
    };
  };

  return (
    <OverviewSection
      number={1}
      title="Etapy"
      actions={
        canEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={() => setDialog({ kind: 'add' })}
            className="text-xs max-lg:h-7 max-lg:px-4 max-lg:py-1"
          >
            + Dodaj etap
          </Button>
        )
      }
    >
      {!plan.isLoading && (
        <TimelineCard
          stages={active}
          views={views}
          startDate={project.startDate}
          plannedEndDate={project.plannedEndDate}
        >
          {active.length === 0 && (
            <EmptySectionState
              bare
              title="Utwórz etapy do realizacji projektu"
              hint="Etapy tworzą oś czasu projektu — do nich przypiszesz działania."
              canEdit={canEdit}
            />
          )}
        </TimelineCard>
      )}

      {plan.isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : active.length === 0 ? null : (
        <ol className="animate-fade-in mt-5 flex flex-col gap-3">
          {active.map((stage, index) => (
            <li key={stage.id}>
              <StageCard
                stage={stage}
                view={views[index]}
                index={index}
                canEdit={canEdit}
                onEdit={() => setDialog({ kind: 'edit', stage })}
                onMoveDeadline={() =>
                  setDialog({ kind: 'move-deadline', stage })
                }
                onArchive={() => setDialog({ kind: 'archive', stage })}
                onDelete={() => requestDelete(stage)}
              />
            </li>
          ))}
        </ol>
      )}

      <ArchivedStagesPanel
        stages={plan.archivedStages}
        canEdit={canEdit}
        onRestore={restore}
        onDelete={requestDelete}
      />

      {dialog.kind === 'add' && (
        <StageFormModal
          mode="add"
          stage={null}
          project={project}
          onClose={close}
          onSubmit={submitAdd}
        />
      )}

      {dialog.kind === 'edit' && (
        <StageFormModal
          mode="edit"
          stage={dialog.stage}
          project={project}
          onClose={close}
          onSubmit={(values) => submitEdit(dialog.stage, values)}
        />
      )}

      {dialog.kind === 'move-deadline' && (
        <MoveDeadlineModal
          stage={dialog.stage}
          project={project}
          onClose={close}
          onSubmit={(deadline, note) =>
            submitMoveDeadline(dialog.stage, deadline, note)
          }
        />
      )}

      {dialog.kind === 'shift-following' && (
        <ShiftFollowingStagesDialog
          stageName={dialog.stageName}
          shiftDays={dialog.shiftDays}
          suggestions={dialog.suggestions}
          onClose={close}
          onShift={(suggestions) => applyShift(suggestions, dialog.stageName)}
        />
      )}

      {dialog.kind === 'delete-content' && (
        <DeleteStageModal
          stage={dialog.stage}
          {...contentCounts(dialog.stage)}
          targetOptions={toOptions(plan.moveTargetsFor(dialog.stage.id))}
          onClose={close}
          onConfirm={(strategy) => confirmDelete(dialog.stage, strategy)}
        />
      )}

      {dialog.kind === 'delete-completed' && (
        <DeleteCompletedStageDialog
          stage={dialog.stage}
          {...contentCounts(dialog.stage)}
          onClose={close}
          onArchive={() => confirmArchive(dialog.stage)}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.kind === 'archive'}
        onClose={close}
        onConfirm={() =>
          dialog.kind === 'archive' && confirmArchive(dialog.stage)
        }
        title="Archiwizuj etap"
        description={
          <>
            Etap „{dialog.kind === 'archive' ? dialog.stage.name : ''}” zniknie
            z osi czasu, ale jego działania i zadania zostaną zachowane. Możesz
            go przywrócić w każdej chwili.
          </>
        }
        confirmLabel="Archiwizuj"
      />

      <ConfirmDialog
        isOpen={dialog.kind === 'delete-empty'}
        onClose={close}
        onConfirm={() =>
          dialog.kind === 'delete-empty' &&
          confirmDelete(dialog.stage, { kind: 'none' })
        }
        title="Usuń etap"
        description={
          <>
            Czy na pewno chcesz usunąć etap „
            {dialog.kind === 'delete-empty' ? dialog.stage.name : ''}”? Tej
            operacji nie można cofnąć.
          </>
        }
        confirmLabel="Usuń"
        tone="danger"
      />
    </OverviewSection>
  );
}
