import type { ReactNode } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { HiOutlinePencil } from 'react-icons/hi';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import ProgressBar from '../../projects/components/ProgressBar';
import { formatStageDate } from '../../projects/utils/isoDate';
import type { TaskRow } from '../data';
import {
  DEADLINE_TONE_CLASSES,
  describeDeadline,
} from '../utils/formatDeadline';
import { subtaskProgress } from '../utils/subtaskProgress';
import SubtaskList from './SubtaskList';
import TaskPriorityText from './TaskPriorityText';
import TaskStatusBadge from './TaskStatusBadge';

interface TaskDetailModalProps {
  row: TaskRow;
  today: string;
  contextLabel: string;
  canEdit: boolean;
  canDelete: boolean;
  canComplete: boolean;
  canManageSubtasks: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
  onAddSubtask: (title: string) => void;
  onRenameSubtask: (subtaskId: string, title: string) => void;
  onToggleSubtask: (subtaskId: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
}

const CARD_CLASSES = 'rounded-lg border border-gray-200 px-3 py-2.5';
const CARD_LABEL_CLASSES =
  'text-[10px] font-semibold uppercase tracking-wide text-mutedText';

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={CARD_CLASSES}>
      <p className={CARD_LABEL_CLASSES}>{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Deadline({ row, today }: { row: TaskRow; today: string }) {
  if (!row.effectiveDueDate) {
    return <span className="text-sm text-mutedText">Bez terminu</span>;
  }

  const view = describeDeadline(row.effectiveDueDate, today, {
    isDone: row.status === 'DONE',
    isInherited: row.dueDate === null,
  });

  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span
        className={`text-sm font-medium text-dark ${view.isInherited ? 'italic' : ''}`}
        title={
          view.isInherited
            ? 'Zadanie bez własnego terminu — obowiązuje termin etapu'
            : undefined
        }
      >
        {view.date}
      </span>
      <span className={`text-[11px] ${DEADLINE_TONE_CLASSES[view.tone]}`}>
        {view.relative}
      </span>
    </div>
  );
}

export default function TaskDetailModal({
  row,
  today,
  contextLabel,
  canEdit,
  canDelete,
  canComplete,
  canManageSubtasks,
  onClose,
  onEdit,
  onDelete,
  onToggleDone,
  onAddSubtask,
  onRenameSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}: TaskDetailModalProps) {
  const progress = subtaskProgress(row.subtasks);
  const isDone = row.status === 'DONE';

  const createdAt = row.createdAt;
  const updatedAt = row.updatedAt ?? row.createdAt;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={row.title}
      size="lg"
      header={<TaskStatusBadge status={row.status} />}
    >
      <div className="space-y-5">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-mutedText uppercase">
            Zadanie — {contextLabel}
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-dark">{row.title}</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card label="Osoba">
            <p className="text-sm font-medium text-dark">{row.owner ?? '—'}</p>
          </Card>
          <Card label="Termin">
            <Deadline row={row} today={today} />
          </Card>
          <Card label="Priorytet">
            <TaskPriorityText priority={row.priority} />
          </Card>
          <Card label="Działanie">
            <p className="text-sm font-medium text-darkGreen">
              {row.actionTitle}
            </p>
            <p className="text-[11px] text-mutedText">{row.stageName}</p>
          </Card>
        </div>

        {row.description && (
          <div className={CARD_CLASSES}>
            <p className={CARD_LABEL_CLASSES}>Opis</p>
            <p className="mt-1 text-xs leading-relaxed whitespace-pre-line text-dark">
              {row.description}
            </p>
          </div>
        )}

        {createdAt && (
          <div className={`${CARD_CLASSES} space-y-1`}>
            <p className="text-xs text-grayText">
              <span className={CARD_LABEL_CLASSES}>Utworzono:</span>{' '}
              <span className="font-medium text-dark">
                {formatStageDate(createdAt)}
              </span>
            </p>
            {updatedAt && (
              <p className="text-xs text-grayText">
                <span className={CARD_LABEL_CLASSES}>Ostatnia zmiana:</span>{' '}
                <span className="font-medium text-dark">
                  {formatStageDate(updatedAt)}
                </span>
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {canManageSubtasks && (
            <h4 className="text-base font-semibold text-dark">Podzadania</h4>
          )}

          <div>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-xs text-grayText">Postęp</span>
              <span className="text-xs text-grayText">
                {progress.done}/{progress.total}{' '}
                <span className="ml-1 text-base font-semibold text-darkGreen">
                  {progress.percent}%
                </span>
              </span>
            </div>
            <ProgressBar
              percent={progress.percent}
              ariaLabel={`Postęp podzadań: ${progress.done} z ${progress.total}`}
            />
          </div>

          {canManageSubtasks && (
            <SubtaskList
              subtasks={row.subtasks}
              onAdd={onAddSubtask}
              onRename={onRenameSubtask}
              onToggle={onToggleSubtask}
              onDelete={onDeleteSubtask}
            />
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4">
          {canDelete && (
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={onDelete}
              className="flex items-center gap-2 text-darkRed!"
            >
              <FiTrash2 className="h-4 w-4" aria-hidden="true" />
              Usuń
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="small"
              type="button"
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <HiOutlinePencil className="h-4 w-4" aria-hidden="true" />
              Edytuj
            </Button>
          )}
          {canComplete && (
            <Button
              variant={isDone ? 'outline' : 'primary'}
              size="small"
              type="button"
              onClick={onToggleDone}
              className="font-medium!"
            >
              {isDone ? 'Cofnij' : 'Zrobione'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
