import { Fragment } from 'react';
import { HiChevronRight } from 'react-icons/hi';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { InlineEditField } from '../../../components/ui/InlineEditField';
import type { Category, Column } from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcCategoryTotals,
  calcSpend,
  formatMoney,
} from '../utils/budgetTotals';
import { MENU_REVEAL_CLASSES, moneyEmphasis } from '../styles';
import { RemainingCell, UsageCell } from './SpendCells';

interface CategoryRowProps {
  category: Category;
  columns: Column[];
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: (name: string) => void;
  onToggle: () => void;
  onDelete: () => void;
}

export function CategoryRow({
  category,
  columns,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onRename,
  onToggle,
  onDelete,
}: CategoryRowProps) {
  const totals = calcCategoryTotals(category, columns);
  const spend = calcSpend(totals[PLANNED_COLUMN_ID], totals[SPENT_COLUMN_ID]);
  const isEmpty = category.positions.length === 0;

  return (
    <tr className="animate-fade-in group border-b border-gray-200 bg-white text-xs text-dark transition-colors hover:bg-gray-50">
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={category.expanded}
            aria-label={
              category.expanded
                ? `Zwiń kategorię ${category.name}`
                : `Rozwiń kategorię ${category.name}`
            }
            className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-darkGreen transition-colors hover:bg-lightGreen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen"
          >
            <HiChevronRight
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                category.expanded ? 'rotate-90' : ''
              }`}
              aria-hidden="true"
            />
          </button>
          <div className="min-w-0 flex-1">
            <InlineEditField
              value={category.name}
              isEditing={isEditing}
              onStartEdit={onStartEdit}
              onCancel={onCancelEdit}
              onSave={onRename}
              canEdit
              saveOnBlur
              ariaLabel={`Nazwa kategorii ${category.name}`}
              emptyMessage="Podaj nazwę kategorii"
              displayClassName="font-semibold overflow-visible!"
              inputClassName="animate-pop-in -my-0.5 h-5 py-0 text-xs font-semibold"
            />
          </div>
        </div>
      </td>

      {columns.map((column) => (
        <Fragment key={column.id}>
          <td
            className={`px-3 py-3 whitespace-nowrap ${
              column.type === 'money'
                ? `tabular-nums ${moneyEmphasis(column)}`
                : 'text-gray-400'
            }`}
          >
            {column.type === 'money' ? formatMoney(totals[column.id]) : '—'}
          </td>
          {column.id === SPENT_COLUMN_ID && (
            <RemainingCell spend={spend} isEmpty={isEmpty} />
          )}
        </Fragment>
      ))}

      <UsageCell spend={spend} isEmpty={isEmpty} />

      <td className="px-3 py-3 text-right">
        <ActionMenu
          ariaLabel={`Akcje kategorii ${category.name}`}
          className={`inline-flex h-6 w-6 items-center justify-center ${MENU_REVEAL_CLASSES}`}
          items={[
            { id: 'rename', label: 'Zmień nazwę', onSelect: onStartEdit },
            {
              id: 'delete',
              label: 'Usuń kategorię',
              tone: 'danger',
              onSelect: onDelete,
            },
          ]}
        />
      </td>
    </tr>
  );
}
