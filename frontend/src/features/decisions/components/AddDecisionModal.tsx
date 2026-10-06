import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { FieldError } from '../../../components/ui/FieldError';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  TEXTAREA_CLASSES,
} from '../../../components/ui/formStyles';
import { useProjects } from '../../projects/hooks/useProjectsApi';
import { useCreateEvent } from '../hooks/useEventsApi';

interface AddDecisionFormInputs {
  projectId: string;
  note: string;
}

interface AddDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMPTY_VALUES: AddDecisionFormInputs = { projectId: '', note: '' };

export default function AddDecisionModal({
  isOpen,
  onClose,
}: AddDecisionModalProps) {
  const projects = useProjects(false, isOpen);
  const createEvent = useCreateEvent();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<AddDecisionFormInputs>({
    mode: 'onChange',
    defaultValues: EMPTY_VALUES,
  });
  const noteId = useId();

  const projectOptions = (projects.data ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const close = () => {
    reset(EMPTY_VALUES);
    onClose();
  };

  const onSubmit = async (values: AddDecisionFormInputs) => {
    try {
      await createEvent.mutateAsync({
        projectId: values.projectId,
        content: values.note.trim(),
      });
    } catch (error) {
      const message = (error as Error).message;
      return toast.error(message, { id: message });
    }

    toast.success('Decyzja została dodana');
    close();
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Dodaj decyzję">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES}>Projekt</label>
          <Controller
            name="projectId"
            control={control}
            rules={{ validate: (value) => !!value || 'Wybierz projekt' }}
            render={({ field }) => (
              <Select
                size="md"
                placeholder={projects.isLoading ? 'Ładowanie...' : 'Wybierz'}
                options={projectOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                invalid={!!errors.projectId}
              />
            )}
          />
          <FieldError message={errors.projectId?.message} />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES} htmlFor={noteId}>
            Treść decyzji
          </label>
          <textarea
            {...register('note', {
              validate: (value) =>
                value.trim().length > 0 || 'Treść decyzji nie może być pusta',
            })}
            id={noteId}
            rows={4}
            placeholder="Opisz podjętą decyzję"
            aria-invalid={!!errors.note}
            className={TEXTAREA_CLASSES}
          />
          <FieldError message={errors.note?.message} />
        </div>

        <div className="border-t border-gray-200 flex gap-3 justify-end pt-4">
          <Button variant="outline" size="small" onClick={close} type="button">
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            isPending={createEvent.isPending}
            className="font-medium!"
          >
            Zapisz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
