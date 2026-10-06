import { useState } from 'react';
import { Link } from 'react-router';
import toast from 'react-hot-toast';
import {
  FiCalendar,
  FiFolder,
  FiMinus,
  FiPaperclip,
  FiPlus,
  FiUser,
} from 'react-icons/fi';
import { GoPlus } from 'react-icons/go';
import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../../components/ui/ActionMenu';
import { Button } from '../../../../components/ui/Button';
import { Chip } from '../../../../components/ui/Chip';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import type { SelectOption } from '../../../../components/ui/Select';
import { useAuth } from '../../../../context/useAuth';
import { hasModule } from '../../../../lib/modules';
import { truncateText } from '../../../../lib/truncate';
import { useFolders } from '../../../documents/hooks/useFolders';
import { canManageTasks } from '../../../tasks/utils/taskPermissions';
import type { ProjectPlanApi } from '../../hooks/useProjectPlanApi';
import {
  useProjectIndicators,
  type IndicatorFormValues,
  type IndicatorView,
} from '../../hooks/useProjectIndicators';
import { useMembers } from '../../hooks/useProjectsApi';
import { formatNumericDate } from '../../utils/isoDate';
import ProgressBar from '../ProgressBar';
import EmptySectionState from './EmptySectionState';
import IndicatorFormModal from './IndicatorFormModal';
import OverviewSection from './OverviewSection';

interface IndicatorsSectionProps {
  projectId: string;
  projectEndDate: string | null;
  plan: ProjectPlanApi;
  canEdit: boolean;
}

type IndicatorDialog =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; indicator: IndicatorView; focusDocuments: boolean }
  | { kind: 'delete'; indicator: IndicatorView };

const CLOSED: IndicatorDialog = { kind: 'none' };

const STEP_BUTTON_CLASSES =
  'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-dark transition-colors hover:bg-gray-50 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40';

function assignmentLabel(indicator: IndicatorView): string {
  if (indicator.scope === 'PROJECT') return 'Cały projekt';
  if (indicator.task) return `Zadanie · ${indicator.task.title}`;
  return `Etap · ${indicator.stage?.name ?? ''}`;
}

export default function IndicatorsSection({
  projectId,
  projectEndDate,
  plan,
  canEdit,
}: IndicatorsSectionProps) {
  const { user } = useAuth();
  const canOpenDocuments = hasModule(user, 'DOCUMENTS');
  const {
    indicators,
    steppingId,
    addIndicator,
    editIndicator,
    stepIndicator,
    deleteIndicator,
  } = useProjectIndicators(projectId);
  const membersQuery = useMembers(projectId);
  const managesProject = canManageTasks(user, membersQuery.data ?? []);
  const foldersQuery = useFolders(projectId, canEdit && canOpenDocuments);
  const [dialog, setDialog] = useState<IndicatorDialog>(CLOSED);

  const close = () => setDialog(CLOSED);

  const ownerOptions: SelectOption[] = (membersQuery.data ?? []).map(
    (member) => ({
      value: member.userId,
      label: `${member.user.firstName} ${member.user.lastName}`,
    }),
  );

  const submitAdd = async (values: IndicatorFormValues) => {
    const result = await addIndicator(values);
    if (!result.ok) return toast.error(result.message, { id: result.message });

    close();
    toast.success('Wskaźnik dodany');
  };

  const submitEdit = async (
    indicator: IndicatorView,
    values: IndicatorFormValues,
  ) => {
    const result = await editIndicator(indicator.id, values);
    if (!result.ok) return toast.error(result.message, { id: result.message });

    close();
    toast.success('Wskaźnik zaktualizowany');
  };

  const step = async (indicator: IndicatorView, delta: 1 | -1) => {
    const result = await stepIndicator(indicator.id, delta);
    if (!result.ok) toast.error(result.message, { id: result.message });
  };

  const confirmDelete = async (indicator: IndicatorView) => {
    const result = await deleteIndicator(indicator.id);
    if (!result.ok) return toast.error(result.message, { id: result.message });

    close();
    toast.success('Wskaźnik usunięty');
  };

  const menuItems = (indicator: IndicatorView): ActionMenuItem[] => [
    {
      id: 'edit',
      label: 'Edytuj',
      onSelect: () =>
        setDialog({ kind: 'edit', indicator, focusDocuments: false }),
    },
    {
      id: 'delete',
      label: 'Usuń',
      tone: 'danger',
      onSelect: () => setDialog({ kind: 'delete', indicator }),
    },
  ];

  const attachFolder = (indicator: IndicatorView) =>
    setDialog({ kind: 'edit', indicator, focusDocuments: true });

  const formProps = {
    stages: plan.stages,
    tasksForStage: plan.tasksForStage,
    projectEndDate,
    ownerOptions,
    folders: canOpenDocuments ? (foldersQuery.data ?? []) : null,
    onClose: close,
  };

  return (
    <OverviewSection
      number={3}
      title="Wskaźniki projektowe"
      actions={
        canEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={() => setDialog({ kind: 'add' })}
            className="gap-1 text-xs max-lg:h-7 max-lg:px-4 max-lg:py-1"
          >
            <GoPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Dodaj wskaźnik
          </Button>
        )
      }
    >
      {indicators.length === 0 ? (
        <EmptySectionState
          title="Dodaj wskaźniki do projektu"
          hint="Wskaźniki pokazują, po czym poznasz, że cele zostały osiągnięte."
          canEdit={canEdit}
        />
      ) : (
        <div className="animate-fade-in flex flex-col gap-3">
          {indicators.map((indicator) => {
            const isStepping = steppingId === indicator.id;

            return (
              <article
                key={indicator.id}
                className="rounded-xl border border-gray-200 bg-white px-4 py-4 800:px-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                    <h3 className="min-w-0 text-sm font-bold text-dark 800:text-base">
                      {indicator.name}
                    </h3>
                    <Chip
                      tone="outline"
                      label={truncateText(assignmentLabel(indicator), 100)}
                      className="max-w-full"
                    />
                  </div>
                  {canEdit && (
                    <ActionMenu
                      items={menuItems(indicator)}
                      ariaLabel={`Opcje wskaźnika: ${indicator.name}`}
                      className="-mr-1 shrink-0"
                    />
                  )}
                </div>
                {indicator.description && (
                  <p className="mt-1 max-w-2xl text-xs text-grayText 800:text-sm">
                    {indicator.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 800:flex-nowrap">
                  <span className="shrink-0 text-xs text-grayText">Postęp</span>
                  <ProgressBar
                    percent={indicator.percent}
                    ariaLabel={`Postęp wskaźnika ${indicator.name}`}
                    className="basis-full 800:order-1 800:basis-auto 800:flex-1"
                  />
                  <span className="shrink-0 text-xs font-semibold text-dark 800:order-2 800:text-sm">
                    {indicator.currentValue} / {indicator.targetValue}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-darkGreen 800:order-3 800:text-sm">
                    {indicator.percent}%
                  </span>
                  {canEdit && (
                    <div className="ml-auto flex shrink-0 items-center gap-1.5 800:order-4 800:ml-2">
                      <button
                        type="button"
                        aria-label={`Zmniejsz postęp: ${indicator.name}`}
                        disabled={isStepping || indicator.currentValue <= 0}
                        onClick={() => void step(indicator, -1)}
                        className={STEP_BUTTON_CLASSES}
                      >
                        <FiMinus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Zwiększ postęp: ${indicator.name}`}
                        disabled={
                          isStepping ||
                          indicator.currentValue >= indicator.targetValue
                        }
                        onClick={() => void step(indicator, 1)}
                        className={STEP_BUTTON_CLASSES}
                      >
                        <FiPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>

                {(managesProject || indicator.folders.length > 0) && (
                  <section
                    aria-label="Dokumenty potwierdzające"
                    className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-semibold text-dark">
                        Dokumenty
                      </h4>
                      {canEdit && indicator.folders.length > 0 && (
                        <button
                          type="button"
                          onClick={() => attachFolder(indicator)}
                          className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-darkGreen hover:underline"
                        >
                          <FiPaperclip className="h-3 w-3" aria-hidden="true" />
                          Dołącz folder
                        </button>
                      )}
                    </div>

                    {indicator.folders.length === 0 ? (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-3">
                        <p className="text-[11px] text-grayText">
                          Nie dołączono jeszcze dokumentów, dołącz np. skany
                          list obecności i zdjęcia.
                        </p>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => attachFolder(indicator)}
                            className="flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-darkGreen hover:underline"
                          >
                            <FiPaperclip
                              className="h-3 w-3"
                              aria-hidden="true"
                            />
                            Dołącz folder
                          </button>
                        )}
                      </div>
                    ) : (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {indicator.folders.map((folder) => {
                          const content = (
                            <>
                              <FiFolder
                                className="h-4 w-4 shrink-0 text-darkGreen"
                                aria-hidden="true"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-darkGreen">
                                  {folder.name}
                                </span>
                                {folder.path && (
                                  <span className="block truncate text-[11px] text-mutedText">
                                    {folder.path}
                                  </span>
                                )}
                              </span>
                            </>
                          );

                          return (
                            <li key={folder.id}>
                              {canOpenDocuments ? (
                                <Link
                                  to={`/project/documents?folder=${folder.id}`}
                                  className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 transition-colors hover:bg-lightGreen/40 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
                                >
                                  {content}
                                </Link>
                              ) : (
                                <span className="flex items-center gap-2 rounded-lg bg-white px-3 py-2">
                                  {content}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-3 text-xs text-grayText">
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />
                    Termin:{' '}
                    <span className="font-semibold text-dark">
                      {indicator.deadline
                        ? formatNumericDate(indicator.deadline)
                        : 'brak'}
                    </span>
                    <span>({indicator.deadlineSource})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiUser className="h-3.5 w-3.5" aria-hidden="true" />
                    {indicator.ownerName ?? 'Bez przypisania'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dialog.kind === 'add' && (
        <IndicatorFormModal
          mode="add"
          indicator={null}
          {...formProps}
          onSubmit={submitAdd}
        />
      )}

      {dialog.kind === 'edit' && (
        <IndicatorFormModal
          mode="edit"
          indicator={dialog.indicator}
          focusDocuments={dialog.focusDocuments}
          {...formProps}
          onSubmit={(values) => submitEdit(dialog.indicator, values)}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.kind === 'delete'}
        onClose={close}
        onConfirm={() =>
          dialog.kind === 'delete' && confirmDelete(dialog.indicator)
        }
        title="Usuń wskaźnik"
        description={
          <>
            Czy na pewno chcesz usunąć wskaźnik „
            {dialog.kind === 'delete' ? dialog.indicator.name : ''}”? Dołączone
            foldery pozostaną w Dokumentach. Tej operacji nie można cofnąć.
          </>
        }
        confirmLabel="Usuń"
        tone="danger"
      />
    </OverviewSection>
  );
}
