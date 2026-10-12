import { Fragment, useState } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useAuth } from '../../../context/useAuth';
import { useMembers } from '../../projects/hooks/useProjectsApi';
import { canManageTasks } from '../../tasks/utils/taskPermissions';
import {
  canEditCategoryActuals,
  isSummaryMode,
  settingsOf,
  type BudgetDispatch,
} from '../budgetReducer';
import { TH_CLASSES } from '../styles';
import type {
  BudgetStore,
  BudgetVersion,
  PlanCategory,
  PlanPosition,
  RowChange,
} from '../types';
import {
  EMPTY_ACTUALS,
  SPENT_COLUMN_ID,
  calcCategoryTotals,
  calcInvoicesTotal,
  currentVersion,
  isPlanField,
  positionValues,
  type VersionDiff,
} from '../utils/budgetTotals';
import { AddInvoiceModal } from './AddInvoiceModal';
import { CategoryFormModal } from './CategoryFormModal';
import { CategoryRow } from './CategoryRow';
import { AddColumnButton, ColumnHeader } from './ColumnHeader';
import { DocumentLinkModal } from './DocumentLinkModal';
import { InvoicesRow } from './InvoicesRow';
import { PositionRow } from './PositionRow';
import { TotalsRow } from './TotalsRow';

type PendingDelete =
  | { kind: 'category'; id: string; name: string }
  | { kind: 'column'; id: string; name: string };

type CategoryForm =
  | { kind: 'add' }
  | { kind: 'share'; category: PlanCategory }
  | { kind: 'share-position'; category: PlanCategory; position: PlanPosition };

type DocumentTarget = {
  kind: 'position' | 'category';
  id: string;
  name: string;
};

interface BudgetTableProps {
  projectId: string;
  store: BudgetStore;
  version: BudgetVersion;
  previous: BudgetVersion | null;
  diff: VersionDiff | null;
  folderPaths: Map<string, string> | null;
  dispatch: BudgetDispatch;
}

export function BudgetTable({
  projectId,
  store,
  version,
  previous,
  diff,
  folderPaths,
  dispatch,
}: BudgetTableProps) {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const [invoiceTarget, setInvoiceTarget] = useState<PlanPosition | null>(null);
  const [documentTarget, setDocumentTarget] = useState<DocumentTarget | null>(
    null,
  );
  const [categoryForm, setCategoryForm] = useState<CategoryForm | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const membersQuery = useMembers(projectId);

  const { columns, actuals } = store;
  const versionId = version.id;
  const isOpenVersion = version.status !== 'APPROVED';
  const canEditPlan = store.permissions.canEdit && isOpenVersion;
  const canEditActuals = version.isCurrent || isOpenVersion;
  const canEditColumns = store.permissions.canEdit && canEditActuals;
  const canChangeStatus =
    canEditActuals && canManageTasks(user, membersQuery.data ?? []);
  const currentPositionIds = new Set(
    currentVersion(store).categories.flatMap((category) =>
      category.positions.map(({ id }) => id),
    ),
  );
  const moveTargets = canEditPlan
    ? version.categories.flatMap((category) =>
        category.positions
          .filter(({ id }) => currentPositionIds.has(id))
          .map((position) => ({
            value: position.id,
            label: `${category.name} / ${position.name}`,
          })),
      )
    : null;
  const previousCategories = new Map(
    (previous?.categories ?? []).map((category) => [category.id, category]),
  );
  const categoryRows: { category: PlanCategory; change: RowChange | null }[] = [
    ...version.categories.map((category) => ({
      category,
      change: diff?.addedCategoryIds.has(category.id)
        ? ('ADDED' as const)
        : null,
    })),
    ...(diff?.removedCategories ?? []).map((category) => ({
      category,
      change: 'REMOVED' as const,
    })),
  ];
  const stopEditing = () => setEditingId(null);
  const colSpan = columns.length + 4;

  const toggleId = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];

  const addPosition = (categoryId: string) =>
    dispatch(
      {
        type: 'ADD_POSITION',
        versionId,
        categoryId,
        name: 'Nowa pozycja',
      },
      setEditingId,
    );

  const confirmDelete = () => {
    if (!pendingDelete) return;

    dispatch(
      pendingDelete.kind === 'category'
        ? { type: 'DELETE_CATEGORY', versionId, categoryId: pendingDelete.id }
        : { type: 'DELETE_COLUMN', columnId: pendingDelete.id },
    );
    setPendingDelete(null);
  };

  return (
    <>
      <div className="table-scrollbar overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th scope="col" className={`${TH_CLASSES} min-w-72 text-left`}>
                Kategoria / pozycja
              </th>
              {columns.map((column) => (
                <Fragment key={column.id}>
                  <ColumnHeader
                    column={column}
                    canEdit={canEditColumns}
                    isEditing={editingId === column.id}
                    onStartEdit={() => setEditingId(column.id)}
                    onCancelEdit={stopEditing}
                    onRename={(name) => {
                      dispatch({
                        type: 'RENAME_COLUMN',
                        columnId: column.id,
                        name,
                      });
                      stopEditing();
                    }}
                    onDelete={() =>
                      setPendingDelete({
                        kind: 'column',
                        id: column.id,
                        name: column.name,
                      })
                    }
                  />
                  {column.id === SPENT_COLUMN_ID && (
                    <th scope="col" className={`${TH_CLASSES} text-left`}>
                      Pozostało
                    </th>
                  )}
                </Fragment>
              ))}
              <th scope="col" className={`${TH_CLASSES} text-left`}>
                Wykonanie
              </th>
              <th scope="col" className={`${TH_CLASSES} w-10 text-right`}>
                {canEditColumns && (
                  <AddColumnButton
                    onAdd={(name, columnType) =>
                      dispatch({
                        type: 'ADD_COLUMN',
                        name,
                        columnType,
                      })
                    }
                  />
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            {categoryRows.map(({ category, change }) => {
              const isRemovedCategory = change === 'REMOVED';
              const expanded = !collapsedIds.includes(category.id);
              const canEditCategory =
                canEditActuals && canEditCategoryActuals(store, category);
              const previousCategory = previousCategories.get(category.id);
              const positionRows: {
                position: PlanPosition;
                change: RowChange | null;
              }[] = [
                ...category.positions.map((position) => ({
                  position,
                  change: isRemovedCategory
                    ? ('REMOVED' as const)
                    : diff?.addedPositionIds.has(position.id)
                      ? ('ADDED' as const)
                      : diff?.changed.has(position.id)
                        ? ('CHANGED' as const)
                        : null,
                })),
                ...(isRemovedCategory
                  ? []
                  : (diff?.removedPositions.get(category.id) ?? []).map(
                      (position) => ({
                        position,
                        change: 'REMOVED' as const,
                      }),
                    )),
              ];

              return (
                <Fragment key={category.id}>
                  <CategoryRow
                    category={category}
                    columns={columns}
                    totals={calcCategoryTotals(category, columns, actuals)}
                    previousTotals={
                      diff && change === null && previousCategory
                        ? calcCategoryTotals(previousCategory, columns, actuals)
                        : null
                    }
                    change={change}
                    settings={settingsOf(store, category.id)}
                    partnerName={
                      store.partners.find(
                        ({ id }) => id === category.partnerId,
                      )?.name ?? null
                    }
                    folderPaths={folderPaths}
                    expanded={expanded}
                    canEditPlan={canEditPlan && !isRemovedCategory}
                    canEditActuals={canEditCategory}
                    isEditing={editingId === category.id}
                    onStartEdit={() => setEditingId(category.id)}
                    onCancelEdit={stopEditing}
                    onRename={(name) => {
                      dispatch({
                        type: 'RENAME_CATEGORY',
                        versionId,
                        categoryId: category.id,
                        name,
                      });
                      stopEditing();
                    }}
                    onToggle={() =>
                      setCollapsedIds((ids) => toggleId(ids, category.id))
                    }
                    onDelete={() => {
                      if (category.positions.length === 0) {
                        dispatch({
                          type: 'DELETE_CATEGORY',
                          versionId,
                          categoryId: category.id,
                        });
                        return;
                      }
                      setPendingDelete({
                        kind: 'category',
                        id: category.id,
                        name: category.name,
                      });
                    }}
                    onShare={() => setCategoryForm({ kind: 'share', category })}
                    onRemovePartner={() =>
                      dispatch({
                        type: 'UPDATE_CATEGORY',
                        versionId,
                        categoryId: category.id,
                        name: category.name,
                        partnerId: null,
                      })
                    }
                    onEditDocument={() =>
                      setDocumentTarget({
                        kind: 'category',
                        id: category.id,
                        name: category.name,
                      })
                    }
                    onRemoveDocument={() =>
                      dispatch({
                        type: 'SET_CATEGORY_DOCUMENT',
                        categoryId: category.id,
                        document: null,
                      })
                    }
                    onTogglePartnerFlag={(flag) =>
                      dispatch({
                        type: 'SET_PARTNER_FLAG',
                        categoryId: category.id,
                        flag,
                        value: !settingsOf(store, category.id)[flag],
                      })
                    }
                  />

                  {expanded && (
                    <>
                      {positionRows.map(({ position, change: rowChange }) => {
                        const positionActuals =
                          actuals[position.id] ?? EMPTY_ACTUALS;
                        const rowPartnerId =
                          position.partnerId ?? category.partnerId;
                        const detailed = !isSummaryMode(
                          store,
                          category,
                          rowPartnerId,
                        );
                        const isExpanded =
                          detailed &&
                          rowChange !== 'REMOVED' &&
                          expandedIds.includes(position.id);

                        return (
                          <Fragment key={position.id}>
                            <PositionRow
                              position={position}
                              values={positionValues(position, actuals)}
                              actuals={positionActuals}
                              columns={columns}
                              change={rowChange}
                              previousPlan={diff?.changed.get(position.id)}
                              partnerName={
                                store.partners.find(
                                  ({ id }) => id === position.partnerId,
                                )?.name ?? null
                              }
                              detailed={detailed}
                              expanded={isExpanded}
                              canEditPlan={canEditPlan}
                              canEditActuals={
                                canEditActuals &&
                                canEditCategoryActuals(
                                  store,
                                  category,
                                  rowPartnerId,
                                ) &&
                                currentPositionIds.has(position.id)
                              }
                              canChangeStatus={canChangeStatus}
                              canTypeSpent={store.permissions.canEdit}
                              isEditing={editingId === position.id}
                              folderPaths={folderPaths}
                              moveTargets={moveTargets}
                              onStartEdit={() => setEditingId(position.id)}
                              onCancelEdit={stopEditing}
                              onRename={(name) => {
                                dispatch({
                                  type: 'RENAME_POSITION',
                                  versionId,
                                  categoryId: category.id,
                                  positionId: position.id,
                                  name,
                                });
                                stopEditing();
                              }}
                              onUpdateCell={(columnId, value) =>
                                dispatch(
                                  isPlanField(columnId)
                                    ? {
                                        type: 'UPDATE_PLAN',
                                        versionId,
                                        categoryId: category.id,
                                        positionId: position.id,
                                        field: columnId,
                                        value,
                                      }
                                    : {
                                        type: 'UPDATE_CELL',
                                        categoryId: category.id,
                                        positionId: position.id,
                                        columnId,
                                        value,
                                      },
                                )
                              }
                              onToggle={() =>
                                setExpandedIds((ids) =>
                                  toggleId(ids, position.id),
                                )
                              }
                              onAddInvoice={() => setInvoiceTarget(position)}
                              onDelete={() =>
                                dispatch({
                                  type: 'DELETE_POSITION',
                                  versionId,
                                  categoryId: category.id,
                                  positionId: position.id,
                                })
                              }
                              onShare={() =>
                                setCategoryForm({
                                  kind: 'share-position',
                                  category,
                                  position,
                                })
                              }
                              onRemovePartner={() =>
                                dispatch({
                                  type: 'SET_POSITION_PARTNER',
                                  versionId,
                                  categoryId: category.id,
                                  positionId: position.id,
                                  partnerId: null,
                                })
                              }
                              onSetStatus={(status) =>
                                dispatch({
                                  type: 'SET_POSITION_STATUS',
                                  positionId: position.id,
                                  status,
                                })
                              }
                              onEditDocument={() =>
                                setDocumentTarget({
                                  kind: 'position',
                                  id: position.id,
                                  name: position.name,
                                })
                              }
                              onRemoveDocument={() =>
                                dispatch({
                                  type: 'SET_POSITION_DOCUMENT',
                                  positionId: position.id,
                                  document: null,
                                })
                              }
                              onMoveActuals={(toPositionId) =>
                                dispatch({
                                  type: 'MOVE_ACTUALS',
                                  fromPositionId: position.id,
                                  toPositionId,
                                })
                              }
                            />
                            {isExpanded && (
                              <InvoicesRow
                                invoices={positionActuals.invoices}
                                incurred={
                                  Number(
                                    positionActuals.values[SPENT_COLUMN_ID],
                                  ) || 0
                                }
                                invoicesTotal={calcInvoicesTotal(
                                  positionActuals,
                                )}
                                colSpan={colSpan}
                                folderPaths={folderPaths}
                                canChangeStatus={
                                  canChangeStatus &&
                                  currentPositionIds.has(position.id)
                                }
                                onSetStatus={(invoiceId, status) =>
                                  dispatch({
                                    type: 'SET_INVOICE_STATUS',
                                    positionId: position.id,
                                    invoiceId,
                                    status,
                                  })
                                }
                                onDelete={(invoiceId) =>
                                  dispatch({
                                    type: 'DELETE_INVOICE',
                                    positionId: position.id,
                                    invoiceId,
                                  })
                                }
                                onRecalc={() =>
                                  dispatch({
                                    type: 'RECALC_FROM_INVOICES',
                                    positionId: position.id,
                                  })
                                }
                              />
                            )}
                          </Fragment>
                        );
                      })}
                      {canEditPlan && !isRemovedCategory && (
                        <tr className="animate-fade-in bg-white">
                          <td colSpan={colSpan} className="py-1.5 pl-10">
                            <button
                              type="button"
                              onClick={() => addPosition(category.id)}
                              className="inline-flex min-h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-darkGreen transition-colors hover:bg-lightGreen hover:text-darkGreenHover focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:outline-none"
                            >
                              <HiOutlinePlus
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              Dodaj pozycję
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </Fragment>
              );
            })}
          </tbody>

          <tfoot>
            <TotalsRow
              categories={version.categories}
              columns={columns}
              actuals={actuals}
            />
          </tfoot>
        </table>
      </div>

      {canEditPlan && (
        <Button
          type="button"
          variant="outline"
          size="compact"
          onClick={() => setCategoryForm({ kind: 'add' })}
          className="mt-4 border-dark!"
        >
          <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
          Dodaj kategorię
        </Button>
      )}

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={
          pendingDelete?.kind === 'column' ? 'Usuń kolumnę' : 'Usuń kategorię'
        }
        description={
          pendingDelete?.kind === 'column'
            ? `Kolumna „${pendingDelete.name}” zostanie usunięta razem z wartościami we wszystkich pozycjach.`
            : `Kategoria „${pendingDelete?.name ?? ''}” zostanie usunięta z tego aneksu razem ze wszystkimi pozycjami.`
        }
        confirmLabel="Usuń"
        tone="danger"
      />

      {invoiceTarget && (
        <AddInvoiceModal
          projectId={projectId}
          positionName={invoiceTarget.name}
          folderPaths={folderPaths}
          onClose={() => setInvoiceTarget(null)}
          onAdd={(invoice, onDone) =>
            dispatch(
              {
                type: 'ADD_INVOICE',
                positionId: invoiceTarget.id,
                invoice,
              },
              onDone,
            )
          }
        />
      )}

      {documentTarget && (
        <DocumentLinkModal
          projectId={projectId}
          title={`${documentTarget.kind === 'category' ? 'Dokument kategorii' : 'Dokument pozycji'}: ${documentTarget.name}`}
          folderPaths={folderPaths}
          initialLink={
            documentTarget.kind === 'category'
              ? settingsOf(store, documentTarget.id).document
              : (actuals[documentTarget.id] ?? EMPTY_ACTUALS).document
          }
          onClose={() => setDocumentTarget(null)}
          onSave={(document) =>
            dispatch(
              documentTarget.kind === 'category'
                ? {
                    type: 'SET_CATEGORY_DOCUMENT',
                    categoryId: documentTarget.id,
                    document,
                  }
                : {
                    type: 'SET_POSITION_DOCUMENT',
                    positionId: documentTarget.id,
                    document,
                  },
            )
          }
        />
      )}

      {categoryForm && (
        <CategoryFormModal
          partners={store.partners}
          initial={
            categoryForm.kind === 'share'
              ? categoryForm.category
              : categoryForm.kind === 'share-position'
                ? categoryForm.position
                : null
          }
          partnerOnly={categoryForm.kind !== 'add'}
          onClose={() => setCategoryForm(null)}
          onSave={({ name, partnerId }) =>
            dispatch(
              categoryForm.kind === 'share'
                ? {
                    type: 'UPDATE_CATEGORY',
                    versionId,
                    categoryId: categoryForm.category.id,
                    name,
                    partnerId,
                  }
                : categoryForm.kind === 'share-position'
                  ? {
                      type: 'SET_POSITION_PARTNER',
                      versionId,
                      categoryId: categoryForm.category.id,
                      positionId: categoryForm.position.id,
                      partnerId,
                    }
                  : {
                      type: 'ADD_CATEGORY',
                      versionId,
                      name,
                      partnerId,
                    },
            )
          }
        />
      )}
    </>
  );
}
