import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../../components/ui/ConfirmDialog';
import type { SelectOption } from '../../../../../components/ui/Select';
import {
  pluralizePl,
  STAGE_FORMS,
  TASK_FORMS,
} from '../../../../../lib/pluralizePl';
import { Spinner } from '../../../../../components/ui/Spinner';
import type {
  ActionResult,
  ProjectPlanApi,
} from '../../../hooks/useProjectPlanApi';
import type { ScheduleAction, ScheduleTask } from '../../../types';
import type { Stage } from '../../../types';
import {
  SCHEDULE_ISSUE_MESSAGES,
  type ScheduleIssue,
} from '../../../utils/scheduleRules';
import { actionsForStage, tasksForAction } from '../../../utils/scheduleState';
import { isInPeriod, type SchedulePeriod } from '../../../utils/schedulePeriod';
import { describeStage } from '../../../utils/stageState';
import EmptySectionState from '../EmptySectionState';
import OverviewSection from '../OverviewSection';
import ActionFormModal, { type ActionFormInputs } from './ActionFormModal';
import OverdueList from './OverdueList';
import ScheduleFilters from './ScheduleFilters';
import StageAccordion, { type VisibleStage } from './StageAccordion';

interface ScheduleSectionProps {
  plan: ProjectPlanApi;
  canEdit: boolean;
  canToggleTask: (task: ScheduleTask) => boolean;
}

type ScheduleDialog =
  | { kind: 'none' }
  | { kind: 'add-action' }
  | { kind: 'edit-action'; action: ScheduleAction }
  | { kind: 'move-action'; action: ScheduleAction }
  | { kind: 'delete-action'; action: ScheduleAction };

const CLOSED: ScheduleDialog = { kind: 'none' };

export default function ScheduleSection({
  plan,
  canEdit,
  canToggleTask,
}: ScheduleSectionProps) {
  const [period, setPeriod] = useState<SchedulePeriod>('all');
  const [onlyUndone, setOnlyUndone] = useState(false);
  const [openOverride, setOpenOverride] = useState<Set<string> | null>(null);
  const [dialog, setDialog] = useState<ScheduleDialog>(CLOSED);

  const close = () => setDialog(CLOSED);

  const report = async (
    pending: Promise<ActionResult>,
    success: string,
  ): Promise<boolean> => {
    const result = await pending;

    if (!result.ok) {
      toast.error(
        'issue' in result
          ? SCHEDULE_ISSUE_MESSAGES[result.issue]
          : result.message,
      );
      return false;
    }
    close();
    toast.success(success);
    return true;
  };

  const active = plan.activeStages;
  const views = active.map((stage) =>
    describeStage(stage, plan.countsFor(stage.id), plan.today),
  );

  const openStageIds =
    openOverride ??
    new Set(
      active
        .filter((_, index) => views[index].status === 'in_progress')
        .map((stage) => stage.id),
    );
  const isFiltered = period !== 'all' || onlyUndone;
  const activeActionCount = active.reduce(
    (total, stage) => total + actionsForStage(plan.index, stage.id).length,
    0,
  );

  const isTaskVisible = (task: ScheduleTask, stage: Stage): boolean => {
    if (onlyUndone && task.status === 'DONE') return false;
    return isInPeriod(task.dueDate ?? stage.deadline, period, plan.today);
  };

  const allEntries: VisibleStage[] = active.map((stage, index) => ({
    stage,
    view: views[index],
    ordinal: index + 1,
    actions: actionsForStage(plan.index, stage.id)
      .map((action) => ({
        action,
        tasks: tasksForAction(plan.index, action.id).filter((task) =>
          isTaskVisible(task, stage),
        ),
      }))
      .filter(({ tasks }) => !isFiltered || tasks.length > 0),
  }));

  const entries = isFiltered
    ? allEntries.filter((entry) => entry.actions.length > 0)
    : allEntries;
  const hiddenCount = allEntries.length - entries.length;

  const toggleStage = (stageId: string) => {
    const next = new Set(openStageIds);
    if (!next.delete(stageId)) next.add(stageId);
    setOpenOverride(next);
  };

  const stageOptions: SelectOption[] = plan
    .actionStageTargets()
    .map((stage) => ({ value: stage.id, label: stage.name }));

  const requestAddAction = () => {
    if (stageOptions.length === 0) {
      const issue: ScheduleIssue = 'noOpenStages';
      toast.error(SCHEDULE_ISSUE_MESSAGES[issue]);
      return;
    }
    setDialog({ kind: 'add-action' });
  };

  const submitAddAction = (values: ActionFormInputs) => {
    void report(plan.addAction(values), 'Działanie dodane');
  };

  const submitEditAction = (action: ScheduleAction, title: string) => {
    void report(plan.editAction(action.id, title), 'Nazwa działania zmieniona');
  };

  const submitMoveAction = (action: ScheduleAction, stageId: string) => {
    void report(plan.moveAction(action.id, stageId), 'Działanie przeniesione');
  };

  const confirmDeleteAction = (action: ScheduleAction) => {
    void report(plan.deleteAction(action.id), 'Działanie usunięte');
  };

  const toggleTask = (taskId: string) => {
    const task = plan.schedule.tasks.find((entry) => entry.id === taskId);
    void report(
      plan.toggleTask(taskId),
      task?.status === 'DONE'
        ? 'Zadanie wróciło do realizacji'
        : 'Zadanie oznaczone jako zrobione',
    );
  };

  const actionTitleOf = (task: ScheduleTask) =>
    plan.index.actionById.get(task.actionId)?.title ?? 'Bez działania';

  const overdue = plan.overdue();
  const deleteActionTaskCount =
    dialog.kind === 'delete-action'
      ? tasksForAction(plan.index, dialog.action.id).length
      : 0;

  return (
    <OverviewSection
      number={4}
      title="Harmonogram"
      actions={
        canEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={requestAddAction}
            className="text-xs max-lg:h-7 max-lg:px-4 max-lg:py-1"
          >
            + Dodaj działanie
          </Button>
        )
      }
    >
      <div className="flex flex-col gap-3 800:block 800:rounded-xl 800:border 800:border-gray-200 800:bg-white 800:px-6 800:py-5">
        <ScheduleFilters
          period={period}
          onlyUndone={onlyUndone}
          onPeriodChange={setPeriod}
          onOnlyUndoneChange={setOnlyUndone}
        />

        <OverdueList
          tasks={overdue}
          actionTitle={actionTitleOf}
          canToggle={canToggleTask}
          onToggle={toggleTask}
        />
        {plan.isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : active.length === 0 ? (
          <EmptySectionState
            className="800:mt-5 800:rounded-lg"
            title="Utwórz działania dla etapów"
            hint="Działanie zawsze należy do etapu — zacznij od dodania etapu w sekcji „Etapy”."
            canEdit={canEdit}
          />
        ) : activeActionCount === 0 ? (
          <EmptySectionState
            className="800:mt-5 800:rounded-lg"
            title="Utwórz działania dla etapów"
            hint="Działanie przypisujesz do etapu, a zadania do działania — dzięki temu każde zadanie wiadomo, do którego etapu należy."
            canEdit={canEdit}
          />
        ) : (
          <div className="animate-fade-in flex flex-col gap-3 800:mt-6 800:gap-4">
            {entries.map((entry) => (
              <StageAccordion
                key={entry.stage.id}
                entry={entry}
                isOpen={openStageIds.has(entry.stage.id)}
                isFiltered={isFiltered}
                today={plan.today}
                canEdit={canEdit}
                canToggleTask={canToggleTask}
                onToggle={() => toggleStage(entry.stage.id)}
                onEditAction={(action) =>
                  setDialog({ kind: 'edit-action', action })
                }
                onMoveAction={(action) =>
                  setDialog({ kind: 'move-action', action })
                }
                onDeleteAction={(action) =>
                  setDialog({ kind: 'delete-action', action })
                }
                onToggleTask={toggleTask}
              />
            ))}
            {entries.length === 0 ? (
              <p className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-xs text-mutedText">
                Żaden etap nie ma zadań w wybranym oknie czasowym.
              </p>
            ) : (
              hiddenCount > 0 && (
                <p className="text-xs text-mutedText">
                  Ukryto {pluralizePl(hiddenCount, STAGE_FORMS)} bez zadań w
                  wybranym oknie czasowym.
                </p>
              )
            )}
          </div>
        )}
      </div>

      {dialog.kind === 'add-action' && (
        <ActionFormModal
          mode="add"
          action={null}
          stageOptions={stageOptions}
          onClose={close}
          onSubmit={submitAddAction}
        />
      )}

      {dialog.kind === 'edit-action' && (
        <ActionFormModal
          mode="edit"
          action={dialog.action}
          stageOptions={stageOptions}
          onClose={close}
          onSubmit={(values) => submitEditAction(dialog.action, values.title)}
        />
      )}

      {dialog.kind === 'move-action' && (
        <ActionFormModal
          mode="move"
          action={dialog.action}
          stageOptions={stageOptions}
          onClose={close}
          onSubmit={(values) => submitMoveAction(dialog.action, values.stageId)}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.kind === 'delete-action'}
        onClose={close}
        onConfirm={() =>
          dialog.kind === 'delete-action' && confirmDeleteAction(dialog.action)
        }
        title="Usuń działanie"
        description={
          <>
            Działanie „
            {dialog.kind === 'delete-action' ? dialog.action.title : ''}”
            zostanie usunięte wraz z{' '}
            {pluralizePl(deleteActionTaskCount, TASK_FORMS)}. Tej operacji nie
            można cofnąć.
          </>
        }
        confirmLabel="Usuń"
        tone="danger"
      />
    </OverviewSection>
  );
}
