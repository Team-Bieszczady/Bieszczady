import { useId, useState } from 'react';
import { Modal } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import {
  ACTION_FORMS,
  pluralizePl,
  TASK_FORMS,
} from '../../../../../lib/pluralizePl';
import type { Stage } from '../../../types';

interface DeleteCompletedStageDialogProps {
  stage: Stage;
  actionsCount: number;
  tasksCount: number;
  onClose: () => void;
  onArchive: () => void;
}

export default function DeleteCompletedStageDialog({
  stage,
  actionsCount,
  tasksCount,
  onClose,
  onArchive,
}: DeleteCompletedStageDialogProps) {
  const [showWarning, setShowWarning] = useState(false);
  const warningId = useId();

  return (
    <Modal isOpen onClose={onClose} title="Usuń zakończony etap">
      <div className="space-y-5">
        <p className="text-sm text-dark/75">
          Etap „{stage.name}” jest zakończony. Zamiast go usuwać, zarchiwizuj go
          — zniknie z osi czasu, ale historia działań i zadań zostanie
          zachowana.
        </p>

        <div>
          <button
            type="button"
            onClick={() => setShowWarning((value) => !value)}
            aria-expanded={showWarning}
            aria-controls={warningId}
            className="cursor-pointer rounded-md text-xs font-semibold text-darkRed underline-offset-2 transition-colors hover:underline focus-visible:ring-1 focus-visible:ring-darkRed focus-visible:outline-none"
          >
            Chcę mimo to usunąć trwale
          </button>

          {showWarning && (
            <p
              id={warningId}
              className="animate-fade-in mt-3 rounded-lg bg-redSoft px-3 py-2.5 text-xs leading-relaxed text-darkRed"
            >
              Trwałe usunięcie skasuje {pluralizePl(actionsCount, ACTION_FORMS)}{' '}
              i {pluralizePl(tasksCount, TASK_FORMS)} razem z historią etapu.
              Najpierw zarchiwizuj etap — usuniesz go później z listy
              zarchiwizowanych.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <Button
            variant="ghost"
            size="compact"
            type="button"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="compact"
            type="button"
            onClick={onArchive}
          >
            Archiwizuj etap
          </Button>
        </div>
      </div>
    </Modal>
  );
}
