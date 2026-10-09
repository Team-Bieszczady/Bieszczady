import { Fragment, useState, type Dispatch } from 'react';
import { HiOutlinePlus } from 'react-icons/hi';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import type { BudgetAction } from '../budgetReducer';
import { TH_CLASSES } from '../styles';
import type { BudgetState } from '../types';
import { SPENT_COLUMN_ID } from '../utils/budgetTotals';
import { CategoryRow } from './CategoryRow';
import { AddColumnButton, ColumnHeader } from './ColumnHeader';
import { PositionRow } from './PositionRow';
import { TotalsRow } from './TotalsRow';

type PendingDelete =
  | { kind: 'category'; id: string; name: string }
  | { kind: 'column'; id: string; name: string };

interface BudgetTableProps {
  state: BudgetState;
  dispatch: Dispatch<BudgetAction>;
}

export function BudgetTable({ state, dispatch }: BudgetTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null,
  );
  const { columns, categories } = state;
  const stopEditing = () => setEditingId(null);

  const addCategory = () => {
    const id = crypto.randomUUID();
    dispatch({ type: 'ADD_CATEGORY', id, name: 'Nowa kategoria' });
    setEditingId(id);
  };

  const addPosition = (categoryId: string) => {
    const id = crypto.randomUUID();
    dispatch({ type: 'ADD_POSITION', categoryId, id, name: 'Nowa pozycja' });
    setEditingId(id);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;

    dispatch(
      pendingDelete.kind === 'category'
        ? { type: 'DELETE_CATEGORY', categoryId: pendingDelete.id }
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
                <AddColumnButton
                  onAdd={(name, columnType) =>
                    dispatch({
                      type: 'ADD_COLUMN',
                      id: crypto.randomUUID(),
                      name,
                      columnType,
                    })
                  }
                />
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <Fragment key={category.id}>
                <CategoryRow
                  category={category}
                  columns={columns}
                  isEditing={editingId === category.id}
                  onStartEdit={() => setEditingId(category.id)}
                  onCancelEdit={stopEditing}
                  onRename={(name) => {
                    dispatch({
                      type: 'RENAME_CATEGORY',
                      categoryId: category.id,
                      name,
                    });
                    stopEditing();
                  }}
                  onToggle={() =>
                    dispatch({
                      type: 'TOGGLE_CATEGORY',
                      categoryId: category.id,
                    })
                  }
                  onDelete={() => {
                    if (category.positions.length === 0) {
                      dispatch({
                        type: 'DELETE_CATEGORY',
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
                />

                {category.expanded && (
                  <>
                    {category.positions.map((position) => (
                      <PositionRow
                        key={position.id}
                        position={position}
                        columns={columns}
                        isEditing={editingId === position.id}
                        onStartEdit={() => setEditingId(position.id)}
                        onCancelEdit={stopEditing}
                        onRename={(name) => {
                          dispatch({
                            type: 'RENAME_POSITION',
                            categoryId: category.id,
                            positionId: position.id,
                            name,
                          });
                          stopEditing();
                        }}
                        onUpdateCell={(columnId, value) =>
                          dispatch({
                            type: 'UPDATE_CELL',
                            categoryId: category.id,
                            positionId: position.id,
                            columnId,
                            value,
                          })
                        }
                        onDelete={() =>
                          dispatch({
                            type: 'DELETE_POSITION',
                            categoryId: category.id,
                            positionId: position.id,
                          })
                        }
                      />
                    ))}
                    <tr className="animate-fade-in bg-white">
                      <td colSpan={columns.length + 4} className="py-1.5 pl-10">
                        <button
                          type="button"
                          onClick={() => addPosition(category.id)}
                          className="inline-flex min-h-6 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-darkGreen transition-colors hover:bg-lightGreen hover:text-darkGreenHover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen"
                        >
                          <HiOutlinePlus
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          Dodaj pozycję
                        </button>
                      </td>
                    </tr>
                  </>
                )}
              </Fragment>
            ))}
          </tbody>

          <tfoot>
            <TotalsRow categories={categories} columns={columns} />
          </tfoot>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="compact"
        onClick={addCategory}
        className="mt-4 border-dark!"
      >
        <HiOutlinePlus className="h-4 w-4" aria-hidden="true" />
        Dodaj kategorię
      </Button>

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
            : `Kategoria „${pendingDelete?.name ?? ''}” zostanie usunięta razem ze wszystkimi pozycjami.`
        }
        confirmLabel="Usuń"
        tone="danger"
      />
    </>
  );
}
