import { useEffect, useId, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FiFolder } from 'react-icons/fi';
import { Button } from '../../../../components/ui/Button';
import { FieldError } from '../../../../components/ui/FieldError';
import { Modal } from '../../../../components/ui/Modal';
import { RadioOptionCard } from '../../../../components/ui/RadioOptionCard';
import { Select, type SelectOption } from '../../../../components/ui/Select';
import {
  FIELD_LABEL_CLASSES,
  INPUT_CLASSES,
  TEXTAREA_CLASSES,
} from '../../../../components/ui/formStyles';
import type { BackendFolder } from '../../../../lib/api';
import { collectAncestorIds } from '../../../documents/utils/folderTree';
import type {
  IndicatorFormValues,
  IndicatorView,
} from '../../hooks/useProjectIndicators';
import type { ScheduleTask, Stage } from '../../types';
import { formatNumericDate } from '../../utils/isoDate';

interface IndicatorFormModalProps {
  mode: 'add' | 'edit';
  indicator: IndicatorView | null;
  stages: Stage[];
  tasksForStage: (stageId: string) => ScheduleTask[];
  projectEndDate: string | null;
  ownerOptions: SelectOption[];
  folders: BackendFolder[] | null;
  focusDocuments?: boolean;
  onClose: () => void;
  onSubmit: (values: IndicatorFormValues) => void | Promise<unknown>;
}

const SECTION_TITLE_CLASSES =
  'text-[11px] font-semibold tracking-[0.5px] text-mutedText uppercase';

function folderPath(folders: BackendFolder[], folder: BackendFolder): string {
  const byId = new Map(folders.map((entry) => [entry.id, entry]));
  return [...collectAncestorIds(folders, folder.id)]
    .slice(1)
    .reverse()
    .map((id) => byId.get(id)?.name ?? '')
    .join(' / ');
}

export default function IndicatorFormModal({
  mode,
  indicator,
  stages,
  tasksForStage,
  projectEndDate,
  ownerOptions,
  folders,
  focusDocuments = false,
  onClose,
  onSubmit,
}: IndicatorFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<IndicatorFormValues>({
    defaultValues: {
      name: indicator?.name ?? '',
      description: indicator?.description ?? '',
      targetValue: indicator?.targetValue ?? 1,
      currentValue: indicator?.currentValue ?? 0,
      scope: indicator?.scope ?? 'STAGE',
      assignment: indicator?.assignment ?? '',
      folderIds: indicator?.folders.map((folder) => folder.id) ?? [],
      ownerId: indicator?.ownerId ?? null,
    },
  });

  const [name, targetValue, scope, assignment] = useWatch({
    control,
    name: ['name', 'targetValue', 'scope', 'assignment'],
  });

  const nameId = useId();
  const targetId = useId();
  const currentId = useId();
  const descriptionId = useId();
  const documentsRef = useRef<HTMLFieldSetElement>(null);

  useEffect(() => {
    if (focusDocuments)
      documentsRef.current?.scrollIntoView({ block: 'start' });
  }, [focusDocuments]);

  const offeredStages = stages.filter(
    (stage) =>
      stage.archivedAt === null ||
      assignment === `stage:${stage.id}` ||
      tasksForStage(stage.id).some((task) => assignment === `task:${task.id}`),
  );

  const assignmentOptions: SelectOption[] = offeredStages.flatMap((stage) => [
    {
      value: `stage:${stage.id}`,
      label: `Etap: ${stage.name}, do ${formatNumericDate(stage.deadline)}`,
      level: 'group' as const,
    },
    ...tasksForStage(stage.id).map((task) => ({
      value: `task:${task.id}`,
      label: `${task.title}, do ${formatNumericDate(task.dueDate ?? stage.deadline)}`,
      level: 'nested' as const,
    })),
  ]);

  const [kind, assignedId] = assignment.split(':');
  const assignedStage =
    kind === 'stage'
      ? stages.find((stage) => stage.id === assignedId)
      : stages.find((stage) =>
          tasksForStage(stage.id).some((task) => task.id === assignedId),
        );
  const assignedTask =
    kind === 'task' && assignedStage
      ? tasksForStage(assignedStage.id).find((task) => task.id === assignedId)
      : undefined;

  const deadlinePreview =
    scope === 'PROJECT'
      ? {
          date: projectEndDate,
          note: projectEndDate
            ? 'kończy się z końcem projektu'
            : 'projekt nie ma jeszcze daty zakończenia',
        }
      : assignedTask
        ? {
            date: assignedTask.dueDate ?? assignedStage?.deadline ?? null,
            note: assignedTask.dueDate
              ? 'kończy się razem z wybranym zadaniem'
              : 'zadanie nie ma terminu, kończy się razem z jego etapem',
          }
        : assignedStage
          ? {
              date: assignedStage.deadline,
              note: 'kończy się razem z wybranym etapem',
            }
          : { date: null, note: 'wybierz etap lub zadanie' };

  const sortedFolders = (folders ?? [])
    .map((folder) => ({ folder, path: folderPath(folders ?? [], folder) }))
    .sort((a, b) =>
      `${a.path}/${a.folder.name}`.localeCompare(
        `${b.path}/${b.folder.name}`,
        'pl',
      ),
    );

  const canSubmit = name.trim().length > 0 && Number(targetValue) > 0;

  return (
    <Modal
      isOpen
      size="lg"
      onClose={onClose}
      title={mode === 'add' ? 'Nowy wskaźnik' : 'Edytuj wskaźnik'}
    >
      <form
        onSubmit={handleSubmit(async (values) => {
          await onSubmit(values);
        })}
        className="space-y-6"
      >
        <fieldset className="space-y-4">
          <legend className={SECTION_TITLE_CLASSES}>1. Co mierzymy</legend>

          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={nameId}>
              Nazwa wskaźnika
            </label>
            <input
              {...register('name', {
                validate: (value) =>
                  value.trim().length > 0 || 'Nazwa nie może być pusta',
              })}
              id={nameId}
              autoFocus={!focusDocuments}
              placeholder="np. Liczba przeprowadzonych warsztatów"
              aria-invalid={!!errors.name}
              className={INPUT_CLASSES}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={FIELD_LABEL_CLASSES} htmlFor={targetId}>
                Wartość docelowa
              </label>
              <input
                {...register('targetValue', {
                  valueAsNumber: true,
                  validate: (value) =>
                    (Number.isInteger(value) && value > 0) ||
                    'Podaj liczbę całkowitą większą od 0',
                })}
                id={targetId}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                aria-invalid={!!errors.targetValue}
                className={INPUT_CLASSES}
              />
              <FieldError message={errors.targetValue?.message} />
            </div>

            <div>
              <label className={FIELD_LABEL_CLASSES} htmlFor={currentId}>
                Zrealizowano dotąd
              </label>
              <input
                {...register('currentValue', {
                  valueAsNumber: true,
                  validate: (value) => {
                    if (!Number.isInteger(value) || value < 0) {
                      return 'Podaj liczbę całkowitą nie mniejszą niż 0';
                    }
                    return (
                      value <= getValues('targetValue') ||
                      'Nie może przekraczać wartości docelowej'
                    );
                  },
                })}
                id={currentId}
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                aria-invalid={!!errors.currentValue}
                className={INPUT_CLASSES}
              />
              <FieldError message={errors.currentValue?.message} />
            </div>
          </div>

          <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor={descriptionId}>
              Opis{' '}
              <span className="font-normal text-mutedText">(opcjonalnie)</span>
            </label>
            <textarea
              {...register('description')}
              id={descriptionId}
              rows={2}
              placeholder="np. Warsztaty terenowe dla lokalnych przewodników"
              className={TEXTAREA_CLASSES}
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className={SECTION_TITLE_CLASSES}>
            2. Z czego wynika wskaźnik
          </legend>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <RadioOptionCard
              value="STAGE"
              title="Konkretny etap lub zadanie"
              hint="Kończy się razem z wybranym etapem lub zadaniem."
              isSelected={scope === 'STAGE'}
              registration={register('scope')}
            />
            <RadioOptionCard
              value="PROJECT"
              title="Ogólny dla projektu"
              hint="Kończy się z końcem projektu."
              isSelected={scope === 'PROJECT'}
              registration={register('scope')}
            />
          </div>

          {scope === 'STAGE' && (
            <div>
              <label className={FIELD_LABEL_CLASSES}>Etap lub zadanie</label>
              <Controller
                name="assignment"
                control={control}
                rules={{
                  validate: (value) =>
                    getValues('scope') !== 'STAGE' ||
                    !!value ||
                    'Wybierz etap lub zadanie',
                }}
                render={({ field }) => (
                  <Select
                    size="md"
                    placeholder="Wybierz etap lub zadanie"
                    options={assignmentOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={!!errors.assignment}
                  />
                )}
              />
              <FieldError message={errors.assignment?.message} />
              {assignmentOptions.length === 0 && (
                <p className="mt-1 text-[11px] text-mutedText">
                  Projekt nie ma jeszcze etapów, dodaj je w sekcji Etapy.
                </p>
              )}
            </div>
          )}

          <div
            className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] text-grayText"
            aria-live="polite"
          >
            Termin wskaźnika:{' '}
            <span className="font-semibold text-dark">
              {deadlinePreview.date
                ? formatNumericDate(deadlinePreview.date)
                : 'brak'}
            </span>{' '}
            · {deadlinePreview.note}
          </div>
        </fieldset>

        <fieldset ref={documentsRef} className="space-y-3">
          <legend className={SECTION_TITLE_CLASSES}>
            3. Dokumenty potwierdzające
          </legend>
          <p className="text-[11px] text-grayText">
            Wskaż foldery z dowodami realizacji, np. skany list obecności i
            zdjęcia. Możesz to zrobić także później.
          </p>

          {folders === null ? (
            <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] text-grayText">
              Nie masz dostępu do modułu Dokumenty, więc nie możesz wybrać
              folderów. Dołączone wcześniej foldery zostaną zachowane.
            </p>
          ) : sortedFolders.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[11px] text-grayText">
              Projekt nie ma jeszcze folderów w Dokumentach.
            </p>
          ) : (
            <Controller
              name="folderIds"
              control={control}
              render={({ field }) => (
                <ul className="max-h-52 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                  {sortedFolders.map(({ folder, path }) => {
                    const checked = field.value.includes(folder.id);
                    return (
                      <li key={folder.id}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              field.onChange(
                                checked
                                  ? field.value.filter((id) => id !== folder.id)
                                  : [...field.value, folder.id],
                              )
                            }
                            className="h-3.5 w-3.5 shrink-0 accent-darkGreen"
                          />
                          <FiFolder
                            className="h-4 w-4 shrink-0 text-darkGreen"
                            aria-hidden="true"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-dark">
                              {folder.name}
                            </span>
                            {path && (
                              <span className="block truncate text-[11px] text-mutedText">
                                {path}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            />
          )}
        </fieldset>

        <div>
          <label className={FIELD_LABEL_CLASSES}>Osoba odpowiedzialna</label>
          <Controller
            name="ownerId"
            control={control}
            render={({ field }) => (
              <Select
                size="md"
                placeholder="Bez przypisania"
                options={ownerOptions}
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value || null)}
                onBlur={field.onBlur}
              />
            )}
          />
        </div>

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
            disabled={!canSubmit || isSubmitting}
            className="font-medium!"
          >
            {mode === 'add' ? 'Dodaj wskaźnik' : 'Zapisz'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
