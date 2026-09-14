import { useId } from 'react';
import { FiCheckCircle, FiChevronDown } from 'react-icons/fi';
import { pluralizePl, TASK_FORMS } from '../../../../../lib/pluralizePl';
import type { ScheduleAction, ScheduleTask } from '../../../types';
import type { Stage } from '../../../types';
import type { StageView } from '../../../utils/stageState';
import ActionRow from './ActionRow';

export interface VisibleAction {
  action: ScheduleAction;
  tasks: ScheduleTask[];
}

export interface VisibleStage {
  stage: Stage;
  view: StageView;
  ordinal: number;
  actions: VisibleAction[];
}

interface StageAccordionProps {
  entry: VisibleStage;
  isOpen: boolean;
  isFiltered: boolean;
  today: string;
  canEdit: boolean;
  canToggleTask: (task: ScheduleTask) => boolean;
  onToggle: () => void;
  onEditAction: (action: ScheduleAction) => void;
  onMoveAction: (action: ScheduleAction) => void;
  onDeleteAction: (action: ScheduleAction) => void;
  onToggleTask: (taskId: string) => void;
}

function headerTone(view: StageView, isOpen: boolean): string {
  if (isOpen) return 'bg-lightGreen text-darkGreen hover:bg-lightGreen/70';
  if (view.status === 'completed') {
    return 'bg-gray-100 text-mutedText hover:bg-gray-200/70';
  }
  if (view.isOverdue) return 'bg-redSoft text-darkRed hover:bg-redSoft/70';
  return 'bg-gray-50 text-grayText hover:bg-gray-100';
}

export default function StageAccordion({
  entry,
  isOpen,
  isFiltered,
  today,
  canEdit,
  canToggleTask,
  onToggle,
  onEditAction,
  onMoveAction,
  onDeleteAction,
  onToggleTask,
}: StageAccordionProps) {
  const bodyId = useId();
  const { stage, view, ordinal, actions } = entry;
  const canEditActions = canEdit && view.canAddContent;

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={bodyId}
        className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-left transition-colors ${headerTone(view, isOpen)}`}
      >
        <FiChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-[0.5px] uppercase">
          Etap {ordinal} · {stage.name}
        </span>
        <span className="shrink-0 text-[11px] font-medium normal-case max-500:hidden">
          {view.counts.done}/{pluralizePl(view.counts.total, TASK_FORMS)}
        </span>
        {view.status === 'completed' && (
          <FiCheckCircle
            className="h-4 w-4 shrink-0 text-darkGreen"
            aria-label="Etap zakończony"
          />
        )}
      </button>

      {isOpen && (
        <div
          id={bodyId}
          className="animate-fade-in mt-3 flex flex-col gap-4 px-1 800:px-2"
        >
          {actions.length === 0 ? (
            <p className="text-xs text-mutedText">
              {isFiltered
                ? 'Żadne działanie w tym etapie nie ma zadań w wybranym oknie czasowym.'
                : 'Brak działań w tym etapie — dodaj je przyciskiem „Dodaj działanie”.'}
            </p>
          ) : (
            actions.map(({ action, tasks }, actionIndex) => (
              <ActionRow
                key={action.id}
                action={action}
                ordinal={actionIndex + 1}
                tasks={tasks}
                isFiltered={isFiltered}
                stageDeadline={stage.deadline}
                today={today}
                canEdit={canEditActions}
                canToggle={canToggleTask}
                onEdit={() => onEditAction(action)}
                onMove={() => onMoveAction(action)}
                onDelete={() => onDeleteAction(action)}
                onToggleTask={onToggleTask}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
