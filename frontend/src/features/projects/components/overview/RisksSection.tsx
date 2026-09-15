import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui/Button';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../../components/ui/ActionMenu';
import type { SelectOption } from '../../../../components/ui/Select';
import { RISK_LEVEL_LABELS } from '../../labels';
import { useMembers } from '../../hooks/useProjectsApi';
import {
  useProjectRisks,
  type RiskFormValues,
  type RiskView,
} from '../../hooks/useProjectRisks';
import OverviewSection from './OverviewSection';
import RiskFormModal from './RiskFormModal';
import RiskLevelBadge from './RiskLevelBadge';

interface RisksSectionProps {
  projectId: string;
  canEdit: boolean;
}

type RiskDialog =
  | { kind: 'none' }
  | { kind: 'add' }
  | { kind: 'edit'; risk: RiskView }
  | { kind: 'delete'; risk: RiskView };

const CLOSED: RiskDialog = { kind: 'none' };

const HEADERS = ['OPIS', 'PRAWDOPODOBIEŃSTWO', 'WPŁYW', 'ODPOWIEDZIALNY'];

function AddRiskPrompt({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full cursor-pointer rounded-md px-4 py-6 text-center text-sm text-grayText transition-colors hover:bg-gray-50 hover:text-dark focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
    >
      Dodaj ryzyka
    </button>
  );
}

export default function RisksSection({
  projectId,
  canEdit,
}: RisksSectionProps) {
  const { risks, addRisk, editRisk, deleteRisk } = useProjectRisks(projectId);
  const membersQuery = useMembers(projectId);
  const [dialog, setDialog] = useState<RiskDialog>(CLOSED);

  const close = () => setDialog(CLOSED);

  const ownerOptions: SelectOption[] = (membersQuery.data ?? []).map(
    (member) => ({
      value: member.userId,
      label: `${member.user.firstName} ${member.user.lastName}`,
    }),
  );

  const submitAdd = async (values: RiskFormValues) => {
    const result = await addRisk(values);
    if (!result.ok) return toast.error(result.message, { id: result.message });

    close();
    toast.success('Ryzyko dodane');
  };

  const submitEdit = async (risk: RiskView, values: RiskFormValues) => {
    const result = await editRisk(risk.id, values);
    if (!result.ok) return toast.error(result.message, { id: result.message });

    close();
    toast.success('Ryzyko zaktualizowane');
  };

  const confirmDelete = async (risk: RiskView) => {
    const result = await deleteRisk(risk.id);
    if (!result.ok) return toast.error(result.message, { id: result.message });

    close();
    toast.success('Ryzyko usunięte');
  };

  const menuItems = (risk: RiskView): ActionMenuItem[] => [
    {
      id: 'edit',
      label: 'Edytuj',
      onSelect: () => setDialog({ kind: 'edit', risk }),
    },
    {
      id: 'delete',
      label: 'Usuń',
      tone: 'danger',
      onSelect: () => setDialog({ kind: 'delete', risk }),
    },
  ];

  const isEmpty = risks.length === 0;

  return (
    <OverviewSection
      number={6}
      title="Ryzyka projektu"
      actions={
        canEdit && (
          <Button
            variant="primary"
            size="small"
            onClick={() => setDialog({ kind: 'add' })}
            className="text-xs max-lg:h-7 max-lg:px-4 max-lg:py-1"
          >
            + Dodaj ryzyko
          </Button>
        )
      }
    >
      <div className="animate-fade-in table-scrollbar hidden overflow-x-auto rounded-xl border border-gray-200 bg-white 800:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              {HEADERS.map((header) => (
                <th
                  key={header}
                  className="px-5 py-3 text-left text-[11px] font-semibold tracking-[0.5px] text-mutedText"
                >
                  {header}
                </th>
              ))}
              {canEdit && <th className="w-12 px-5 py-3" />}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={canEdit ? HEADERS.length + 1 : HEADERS.length}>
                  {canEdit ? (
                    <AddRiskPrompt onAdd={() => setDialog({ kind: 'add' })} />
                  ) : (
                    <p className="px-4 py-6 text-center text-sm text-grayText">
                      Brak zarejestrowanych ryzyk
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              risks.map((risk) => (
                <tr
                  key={risk.id}
                  className="border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td className="max-w-sm px-5 py-3.5 text-xs leading-relaxed font-medium text-dark">
                    {risk.description}
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskLevelBadge
                      level={risk.probability}
                      label={RISK_LEVEL_LABELS[risk.probability]}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <RiskLevelBadge
                      level={risk.impact}
                      label={RISK_LEVEL_LABELS[risk.impact]}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium whitespace-nowrap text-dark">
                    {risk.owner}
                  </td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <ActionMenu
                        items={menuItems(risk)}
                        ariaLabel={`Opcje ryzyka: ${risk.description}`}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="animate-fade-in flex flex-col gap-3 800:hidden">
        {isEmpty ? (
          <div className="rounded-xl border border-gray-200 bg-white">
            {canEdit ? (
              <AddRiskPrompt onAdd={() => setDialog({ kind: 'add' })} />
            ) : (
              <p className="px-4 py-6 text-center text-sm text-grayText">
                Brak zarejestrowanych ryzyk
              </p>
            )}
          </div>
        ) : (
          risks.map((risk) => (
            <div
              key={risk.id}
              className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-start gap-2">
                <p className="min-w-0 flex-1 text-xs leading-relaxed font-medium text-dark">
                  {risk.description}
                </p>
                {canEdit && (
                  <ActionMenu
                    items={menuItems(risk)}
                    ariaLabel={`Opcje ryzyka: ${risk.description}`}
                    className="shrink-0"
                  />
                )}
              </div>
              <dl className="mt-3.5 grid grid-cols-1 gap-3">
                <div>
                  <dt className="text-[10px] font-semibold tracking-[0.5px] text-mutedText">
                    {HEADERS[1]}
                  </dt>
                  <dd className="mt-1.5">
                    <RiskLevelBadge
                      level={risk.probability}
                      label={RISK_LEVEL_LABELS[risk.probability]}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold tracking-[0.5px] text-mutedText">
                    {HEADERS[2]}
                  </dt>
                  <dd className="mt-1.5">
                    <RiskLevelBadge
                      level={risk.impact}
                      label={RISK_LEVEL_LABELS[risk.impact]}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold tracking-[0.5px] text-mutedText">
                    {HEADERS[3]}
                  </dt>
                  <dd className="mt-1.5 text-xs font-semibold text-dark">
                    {risk.owner}
                  </dd>
                </div>
              </dl>
            </div>
          ))
        )}
      </div>

      {dialog.kind === 'add' && (
        <RiskFormModal
          mode="add"
          risk={null}
          ownerOptions={ownerOptions}
          onClose={close}
          onSubmit={submitAdd}
        />
      )}

      {dialog.kind === 'edit' && (
        <RiskFormModal
          mode="edit"
          risk={dialog.risk}
          ownerOptions={ownerOptions}
          onClose={close}
          onSubmit={(values) => submitEdit(dialog.risk, values)}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.kind === 'delete'}
        onClose={close}
        onConfirm={() => dialog.kind === 'delete' && confirmDelete(dialog.risk)}
        title="Usuń ryzyko"
        description={
          <>
            Czy na pewno chcesz usunąć ryzyko „
            {dialog.kind === 'delete' ? dialog.risk.description : ''}”? Tej
            operacji nie można cofnąć.
          </>
        }
        confirmLabel="Usuń"
        tone="danger"
      />
    </OverviewSection>
  );
}
