import {
  LuCalendarClock,
  LuFileText,
  LuFlag,
  LuListChecks,
  LuUser,
} from 'react-icons/lu';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useAuth } from '../../../context/useAuth';
import { hasModule } from '../../../lib/modules';
import { TASK_STATUS_LABELS } from '../../projects/labels';
import { formatStageDate, todayIso } from '../../projects/utils/isoDate';
import { useOpenProjectPage } from '../hooks/useOpenProjectPage';
import type { Deadline } from '../types';
import { formatWeekday } from '../utils/calendarView';
import { ProjectName } from './ProjectName';

interface DeadlineDetailsModalProps {
  deadline: Deadline;
  onClose: () => void;
}

const ROW_CLASSES = 'flex items-start gap-3 text-sm text-dark';
const ICON_CLASSES = 'mt-0.5 shrink-0 text-grayText';

function isOverdue(deadline: Deadline) {
  return deadline.status !== 'DONE' && deadline.date < todayIso();
}

function StatusBadge({ deadline }: { deadline: Deadline }) {
  if (deadline.status === 'DONE') {
    return (
      <span className="rounded-full bg-darkGreen px-3 py-1 text-xs font-semibold text-white">
        ✓ {TASK_STATUS_LABELS.DONE}
      </span>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-dark">
        {TASK_STATUS_LABELS[deadline.status]}
      </span>
      {isOverdue(deadline) && (
        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-darkRed">
          Po terminie
        </span>
      )}
    </span>
  );
}

export default function DeadlineDetailsModal({
  deadline,
  onClose,
}: DeadlineDetailsModalProps) {
  const { user } = useAuth();
  const openProjectPage = useOpenProjectPage(onClose);

  const canOpenOverview =
    hasModule(user, 'PROJECTS') && hasModule(user, 'OVERVIEW');
  const canOpenTasks = hasModule(user, 'PROJECTS') && hasModule(user, 'TASKS');

  const header = (
    <div className="flex flex-col items-start gap-3">
      <span className="rounded-full border border-dashed border-darkGreen bg-lightGreen px-3 py-1 text-xs font-semibold text-darkGreen">
        Termin zadania
      </span>
      <h2 className="text-xl font-semibold text-dark">{deadline.title}</h2>
    </div>
  );

  return (
    <Modal isOpen onClose={onClose} title={deadline.title} header={header}>
      <div className="space-y-5 pb-2">
        <div className={ROW_CLASSES}>
          <LuCalendarClock
            size={18}
            className={ICON_CLASSES}
            aria-hidden="true"
          />
          <div>
            <p>
              {formatStageDate(deadline.date)} – {formatWeekday(deadline.date)}
            </p>
            <p className="mt-0.5 text-grayText">do końca dnia</p>
          </div>
        </div>

        <div className={ROW_CLASSES}>
          <LuFileText size={18} className={ICON_CLASSES} aria-hidden="true" />
          <ProjectName
            name={deadline.projectName}
            onOpen={
              canOpenOverview
                ? () => openProjectPage(deadline.projectId, '/project/overview')
                : undefined
            }
          />
        </div>

        <div className={ROW_CLASSES}>
          <LuFlag size={18} className={ICON_CLASSES} aria-hidden="true" />
          <p>{deadline.stageName}</p>
        </div>

        <div className={ROW_CLASSES}>
          <LuUser size={18} className={ICON_CLASSES} aria-hidden="true" />
          {deadline.owner ? (
            <p>
              {deadline.owner.firstName} {deadline.owner.lastName}
            </p>
          ) : (
            <p className="text-grayText">Nikt nie jest przypisany</p>
          )}
        </div>

        <div className={`${ROW_CLASSES} items-center`}>
          <LuListChecks
            size={18}
            className="shrink-0 text-grayText"
            aria-hidden="true"
          />
          <StatusBadge deadline={deadline} />
        </div>
      </div>

      {canOpenTasks && (
        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
          <Button
            variant="primary"
            size="small"
            type="button"
            onClick={() =>
              openProjectPage(deadline.projectId, '/project/tasks')
            }
            className="font-medium!"
          >
            Przejdź do zadań projektu
          </Button>
        </div>
      )}
    </Modal>
  );
}
