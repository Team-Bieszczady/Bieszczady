import { useId } from 'react';
import { FieldError } from '../../../../../components/ui/FieldError';
import { useForm } from 'react-hook-form';
import { Modal } from '../../../../../components/ui/Modal';
import { Button } from '../../../../../components/ui/Button';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../../../components/ui/formStyles';
import type { BackendProject } from '../../../../../lib/projectsApi';
import type { Stage } from '../../../types';
import { formatStageDate, toIsoDate } from '../../../utils/isoDate';
import { STAGE_ISSUE_MESSAGES } from '../../../utils/stageRules';

interface MoveDeadlineInputs {
  deadline: string;
  note: string;
}

interface MoveDeadlineModalProps {
  stage: Stage;
  /** The window the new deadline has to stay inside. */
  project: Pick<BackendProject, 'startDate' | 'plannedEndDate'>;
  onClose: () => void;
  onSubmit: (deadline: string, note: string) => void | Promise<unknown>;
}

export default function MoveDeadlineModal({
  stage,
  project,
  onClose,
  onSubmit,
}: MoveDeadlineModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MoveDeadlineInputs>({
    defaultValues: { deadline: stage.deadline, note: stage.deadlineNote ?? '' },
  });

  const dateId = useId();
  const noteId = useId();
  const completedOn = stage.completedAt ? toIsoDate(stage.completedAt) : null;

  return (
    <Modal isOpen onClose={onClose} title="Przenieś termin etapu">
      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values.deadline, values.note);
        })}
        className="space-y-5"
      >
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5">
          <p className="text-[10px] font-semibold tracking-[0.5px] text-mutedText">
            OBECNY TERMIN
          </p>
          <p className="mt-1 text-sm font-bold text-dark">
            {formatStageDate(stage.deadline)}
          </p>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={dateId}>
            Nowy termin
          </label>
          <input
            {...register('deadline', {
              required: 'Nowy termin jest wymagany',
              validate: (value) => {
                if (value === stage.deadline) {
                  return 'Nowy termin musi różnić się od obecnego';
                }
                if (stage.startDate && value < stage.startDate) {
                  return 'Termin nie może być wcześniejszy niż data rozpoczęcia';
                }
                if (completedOn && value < completedOn) {
                  return 'Termin nie może być wcześniejszy niż data zakończenia etapu';
                }
                if (project.startDate && value < project.startDate) {
                  return STAGE_ISSUE_MESSAGES.startBeforeProject;
                }
                if (project.plannedEndDate && value > project.plannedEndDate) {
                  return STAGE_ISSUE_MESSAGES.deadlineAfterProjectEnd;
                }
                return true;
              },
            })}
            id={dateId}
            autoFocus
            type="date"
            min={stage.startDate ?? project.startDate ?? undefined}
            max={project.plannedEndDate ?? undefined}
            aria-invalid={!!errors.deadline}
            className={INPUT_CLASSES}
          />
          <FieldError message={errors.deadline?.message} />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={noteId}>
            Komentarz{' '}
            <span className="font-normal text-mutedText">(opcjonalnie)</span>
          </label>
          <textarea
            {...register('note')}
            id={noteId}
            rows={2}
            placeholder="Dlaczego termin się przesunął?"
            className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-xs leading-relaxed text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
          />
          <p className="mt-1 text-[11px] text-mutedText">
            Wyświetli się na karcie etapu obok nowego terminu.
          </p>
        </div>

        <p className="rounded-lg bg-amberSoft px-3 py-2.5 text-[11px] leading-relaxed text-amberDark">
          Pierwotny termin zostanie zachowany na osi czasu jako ślad
          przeniesienia.
        </p>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button
            variant="outline"
            size="small"
            type="button"
            onClick={onClose}
          >
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            isPending={isSubmitting}
            disabled={isSubmitting}
            className="font-medium!"
          >
            Przenieś termin
          </Button>
        </div>
      </form>
    </Modal>
  );
}
