import { Controller, useForm, useWatch } from 'react-hook-form';
import { FieldError } from '../../../components/ui/FieldError';
import toast from 'react-hot-toast';
import { IoCheckmark } from 'react-icons/io5';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Spinner } from '../../../components/ui/Spinner';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
} from '../../../components/ui/formStyles';
import { PROJECT_COLORS } from '../constants';
import {
  useCreateProject,
  useProjectRecipients,
  useProjectStatuses,
  useProjectTypes,
} from '../hooks/useProjectsApi';
import { usePeople } from '../../people/hooks/usePeople';
import type { Person } from '../../people/data';
import type {
  CreateProjectPayload,
  DictionaryEntry,
} from '../../../lib/projectsApi';

const fullName = (person: Person) => `${person.firstName} ${person.lastName}`;

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddProjectFormInputs {
  name: string;
  description: string;
  statusId: string;
  budget: string;
  typeId: string;
  recipientId: string;
  startDate: string;
  endDate: string;
  coordinatorId: string;
  color: string;
  team: string[];
}

const DEFAULT_VALUES: AddProjectFormInputs = {
  name: '',
  description: '',
  statusId: '',
  budget: '',
  typeId: '',
  recipientId: '',
  startDate: '',
  endDate: '',
  coordinatorId: '',
  color: PROJECT_COLORS[0].id,
  team: [],
};

export default function AddProjectModal({
  isOpen,
  onClose,
}: AddProjectModalProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddProjectFormInputs>({ defaultValues: DEFAULT_VALUES });

  const statuses = useProjectStatuses();
  const types = useProjectTypes();
  const recipients = useProjectRecipients();
  const people = usePeople({ enabled: isOpen });
  const createProject = useCreateProject();

  const color = useWatch({ control, name: 'color' });
  const team = useWatch({ control, name: 'team' });
  const coordinatorId = useWatch({ control, name: 'coordinatorId' });
  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });

  const candidates = (people.data ?? []).filter(
    (person) =>
      person.accountStatus === 'ACTIVE' &&
      person.status !== 'DELETED' &&
      !person.isDirector,
  );

  const close = () => {
    reset(DEFAULT_VALUES);
    onClose();
  };

  const toggleMember = (userId: string) => {
    setValue(
      'team',
      team.includes(userId)
        ? team.filter((id) => id !== userId)
        : [...team, userId],
    );
  };

  const onSubmit = (values: AddProjectFormInputs) => {
    const members: CreateProjectPayload['members'] = [];
    if (values.coordinatorId) {
      members.push({
        userId: values.coordinatorId,
        projectRole: 'COORDINATOR',
      });
    }
    for (const userId of values.team) {
      if (userId === values.coordinatorId) continue;
      members.push({ userId, projectRole: 'EXECUTOR' });
    }

    const payload: CreateProjectPayload = {
      name: values.name,
      color: values.color,
      ...(values.description ? { description: values.description } : {}),
      ...(values.statusId ? { statusId: values.statusId } : {}),
      ...(values.budget ? { budgetAmount: values.budget } : {}),
      ...(values.startDate ? { startDate: values.startDate } : {}),
      ...(values.endDate ? { plannedEndDate: values.endDate } : {}),
      ...(values.typeId ? { typeIds: [values.typeId] } : {}),
      ...(values.recipientId ? { recipientIds: [values.recipientId] } : {}),
      ...(members.length > 0 ? { members } : {}),
    };

    createProject.mutate(payload, {
      onSuccess: () => {
        toast.success('Projekt został dodany');
        close();
      },
      onError: (error: Error) =>
        toast.error(error.message, { id: error.message }),
    });
  };

  const toOptions = (entries: DictionaryEntry[] | undefined) =>
    (entries ?? [])
      .filter((entry) => entry.active)
      .map((entry) => ({ value: entry.id, label: entry.name }));

  return (
    <Modal isOpen={isOpen} onClose={close} title="Dodaj projekt">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className={FIELD_LABEL_CLASSES}>Nazwa projektu</label>
          <input
            type="text"
            placeholder="Podaj nazwe..."
            className={INPUT_CLASSES}
            {...register('name', {
              validate: (value) =>
                value.trim().length > 0 || 'Nazwa projektu nie może być pusta',
            })}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES}>Opis</label>
          <input
            type="text"
            placeholder="Krótki opis..."
            className={INPUT_CLASSES}
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Status</label>
            <Controller
              name="statusId"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={toOptions(statuses.data)}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>Budżet</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                className={`${INPUT_CLASSES} pr-8`}
                {...register('budget')}
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-dark/50">
                zł
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Typ projektu</label>
            <Controller
              name="typeId"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={toOptions(types.data)}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>Odbiorca</label>
            <Controller
              name="recipientId"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={toOptions(recipients.data)}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Data rozpoczęcia</label>
            <input
              type="date"
              max={endDate || undefined}
              aria-invalid={!!errors.startDate}
              className={INPUT_CLASSES}
              {...register('startDate')}
            />
            <FieldError message={errors.startDate?.message} />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>Planowane zakończenie</label>
            <input
              type="date"
              min={startDate || undefined}
              aria-invalid={!!errors.endDate}
              className={INPUT_CLASSES}
              {...register('endDate', {
                validate: (value) =>
                  !value ||
                  !startDate ||
                  value >= startDate ||
                  'Data zakończenia nie może być wcześniejsza niż data rozpoczęcia',
              })}
            />
            <FieldError message={errors.endDate?.message} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={FIELD_LABEL_CLASSES}>Koordynator</label>
            <Controller
              name="coordinatorId"
              control={control}
              render={({ field }) => (
                <Select
                  size="md"
                  placeholder="Wybierz"
                  options={candidates.map((person) => ({
                    value: person.id,
                    label: fullName(person),
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>
          <div>
            <label className={FIELD_LABEL_CLASSES}>
              Kolor projektu w kalendarzu
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PROJECT_COLORS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`Kolor ${option.id}`}
                  aria-pressed={color === option.id}
                  onClick={() => setValue('color', option.id)}
                  className={`h-7 w-7 cursor-pointer rounded-full transition-shadow ${option.className} ${
                    color === option.id
                      ? 'ring-2 ring-dark/40 ring-offset-2'
                      : 'hover:ring-2 hover:ring-dark/15 hover:ring-offset-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={FIELD_LABEL_CLASSES}>Zespół</label>
          {people.isLoading ? (
            <Spinner variant="dark" size="16" />
          ) : candidates.length === 0 ? (
            <p className="text-xs text-grayText">
              {people.isError
                ? 'Nie udało się pobrać listy osób.'
                : 'Brak aktywnych osób do dodania.'}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {candidates.map((person) => {
                const selected =
                  team.includes(person.id) || person.id === coordinatorId;
                return (
                  <button
                    key={person.id}
                    type="button"
                    aria-pressed={selected}
                    disabled={person.id === coordinatorId}
                    onClick={() => toggleMember(person.id)}
                    className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-70 ${
                      selected
                        ? 'bg-darkGreen text-white hover:bg-darkGreenHover'
                        : 'border border-gray-200 bg-white text-dark hover:bg-gray-50'
                    }`}
                  >
                    {selected && (
                      <IoCheckmark className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    {fullName(person)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
          <Button variant="outline" size="small" onClick={close} type="button">
            Anuluj
          </Button>
          <Button
            variant="primary"
            size="small"
            type="submit"
            disabled={createProject.isPending}
            className="font-medium!"
          >
            {createProject.isPending ? 'Zapisywanie...' : 'Zapisz'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
