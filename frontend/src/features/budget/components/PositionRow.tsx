import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import { Avatar } from '../../../components/ui/Avatar';
import { FieldError } from '../../../components/ui/FieldError';
import { InlineEditField } from '../../../components/ui/InlineEditField';
import { MENU_REVEAL_CLASSES, moneyEmphasis } from '../styles';
import type { Column, Position } from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcSpend,
  formatMoney,
  parseMoney,
} from '../utils/budgetTotals';
import { OverBudgetBadge } from './OverBudgetBadge';
import { SpendCells } from './SpendCells';

function BudgetCell({
  column,
  value,
  positionName,
  onSave,
}: {
  column: Column;
  value: string | number | undefined;
  positionName: string;
  onSave: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const isMoney = column.type === 'money';
  const isEmpty = value === undefined || value === '';
  const label = isEmpty
    ? '—'
    : isMoney
      ? formatMoney(Number(value))
      : String(value);
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  if (isEditing) {
    return (
      <BudgetCellForm
        defaultValue={isEmpty ? '' : String(value)}
        isMoney={isMoney}
        ariaLabel={`${column.name}, ${positionName}`}
        onSave={(nextValue) => {
          onSave(nextValue);
          setIsEditing(false);
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      aria-label={`${column.name}, ${positionName}: ${label}, kliknij, aby edytować`}
      className={`-mx-1.5 flex w-[calc(100%+0.75rem)] cursor-text items-center gap-2 rounded-md px-1.5 py-0.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-darkGreen ${
        isMoney
          ? `justify-end tabular-nums ${moneyEmphasis(column)}`
          : 'justify-start'
      } ${isEmpty ? 'text-gray-400' : ''}`}
    >
      {column.type === 'person' && !isEmpty && (
        <Avatar initials={initials} size="xs" />
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

function BudgetCellForm({
  defaultValue,
  isMoney,
  ariaLabel,
  onSave,
  onCancel,
}: {
  defaultValue: string;
  isMoney: boolean;
  ariaLabel: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const isClosingRef = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ value: string }>({ defaultValues: { value: defaultValue } });

  const submit = handleSubmit(({ value }) => onSave(value));
  const field = register('value', {
    validate: (value) =>
      !isMoney ||
      value.trim() === '' ||
      parseMoney(value) !== null ||
      'Wpisz kwotę, np. 1500 lub 1500,50',
  });

  return (
    <form onSubmit={submit} className="w-full">
      <input
        {...field}
        onBlur={(event) => {
          field.onBlur(event);
          if (!isClosingRef.current) submit();
        }}
        autoFocus
        type="text"
        inputMode={isMoney ? 'decimal' : 'text'}
        aria-label={ariaLabel}
        aria-invalid={errors.value ? true : undefined}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            isClosingRef.current = true;
            onCancel();
          }
        }}
        className={`h-6 w-full rounded-md border border-gray-300 px-2 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none ${
          isMoney ? 'text-right tabular-nums' : ''
        }`}
      />
      <FieldError message={errors.value?.message} />
    </form>
  );
}

interface PositionRowProps {
  position: Position;
  columns: Column[];
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: (name: string) => void;
  onUpdateCell: (columnId: string, value: string) => void;
  onDelete: () => void;
}

export function PositionRow({
  position,
  columns,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onRename,
  onUpdateCell,
  onDelete,
}: PositionRowProps) {
  const spend = calcSpend(
    Number(position.values[PLANNED_COLUMN_ID]) || 0,
    Number(position.values[SPENT_COLUMN_ID]) || 0,
  );

  return (
    <tr className="group border-b border-gray-100 bg-white text-xs font-normal text-dark transition-colors hover:bg-gray-50">
      <td className="py-3 pr-4 pl-10">
        <div className="flex items-center gap-2">
          <div className={`min-w-0 ${isEditing ? 'flex-1' : ''}`}>
            <InlineEditField
              value={position.name}
              isEditing={isEditing}
              onStartEdit={onStartEdit}
              onCancel={onCancelEdit}
              onSave={onRename}
              canEdit
              saveOnBlur
              ariaLabel={`Nazwa pozycji ${position.name}`}
              emptyMessage="Podaj nazwę pozycji"
              inputClassName="h-6 text-xs"
            />
          </div>
          {spend.isOver && !isEditing && <OverBudgetBadge />}
        </div>
      </td>

      {columns.map((column) => (
        <td key={column.id} className="px-4 py-3 whitespace-nowrap">
          <BudgetCell
            column={column}
            value={position.values[column.id]}
            positionName={position.name}
            onSave={(value) => onUpdateCell(column.id, value)}
          />
        </td>
      ))}

      <SpendCells spend={spend} />

      <td className="px-4 py-3 text-right">
        <ActionMenu
          ariaLabel={`Akcje pozycji ${position.name}`}
          className={`inline-flex h-6 w-6 items-center justify-center ${MENU_REVEAL_CLASSES}`}
          items={[
            {
              id: 'delete',
              label: 'Usuń pozycję',
              tone: 'danger',
              onSelect: onDelete,
            },
          ]}
        />
      </td>
    </tr>
  );
}
