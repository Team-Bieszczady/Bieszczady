import { Fragment, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { HiChevronRight } from 'react-icons/hi';
import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../components/ui/ActionMenu';
import { Avatar } from '../../../components/ui/Avatar';
import { FieldError } from '../../../components/ui/FieldError';
import { InlineEditField } from '../../../components/ui/InlineEditField';
import { Select } from '../../../components/ui/Select';
import { INVOICE_STATUS_CLASSES, INVOICE_STATUS_LABELS } from '../data';
import { MENU_REVEAL_CLASSES, moneyEmphasis } from '../styles';
import type {
  Column,
  InvoiceStatus,
  PlanField,
  PlanPosition,
  PositionActuals,
  RowChange,
} from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcSpend,
  formatMoney,
  isPlanField,
  parseMoney,
} from '../utils/budgetTotals';
import { ChangeTag } from './ChangeTag';
import { DocumentLinkChip } from './DocumentLinkChip';
import { RemainingCell, UsageCell } from './SpendCells';

function BudgetCell({
  column,
  value,
  positionName,
  readOnly,
  highlight,
  onSave,
}: {
  column: Column;
  value: string | number | undefined;
  positionName: string;
  readOnly: boolean;
  highlight: boolean;
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
  const tone = highlight
    ? 'tabular-nums font-semibold text-amberDark'
    : isMoney
      ? `tabular-nums ${moneyEmphasis(column)}`
      : '';

  if (readOnly) {
    return (
      <span
        className={`flex items-center gap-2 ${tone} ${isEmpty ? 'text-gray-400' : ''}`}
      >
        {column.type === 'person' && !isEmpty && (
          <Avatar initials={initials} size="xs" />
        )}
        <span className="whitespace-nowrap">{label}</span>
      </span>
    );
  }

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
      className={`-mx-1.5 flex w-[calc(100%+0.75rem)] cursor-text items-center justify-start gap-2 rounded-md px-1.5 py-0.5 transition-colors hover:bg-gray-100 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none ${tone} ${
        isEmpty ? 'text-gray-400' : ''
      }`}
    >
      {column.type === 'person' && !isEmpty && (
        <Avatar initials={initials} size="xs" />
      )}
      <span className="whitespace-nowrap">{label}</span>
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
    <form onSubmit={submit} className="relative w-full">
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
        className={`animate-pop-in h-5 w-full rounded-md border border-gray-300 px-2 text-xs focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none ${
          isMoney ? 'tabular-nums' : ''
        }`}
      />
      <div className="absolute top-full left-0 z-10 whitespace-nowrap">
        <FieldError message={errors.value?.message} />
      </div>
    </form>
  );
}

interface PositionRowProps {
  position: PlanPosition;
  values: Record<string, string | number>;
  actuals: PositionActuals;
  columns: Column[];
  change: RowChange | null;
  previousPlan: Partial<Record<PlanField, number>> | undefined;
  detailed: boolean;
  expanded: boolean;
  canEditPlan: boolean;
  canEditActuals: boolean;
  canChangeStatus: boolean;
  isEditing: boolean;
  folderPaths: Map<string, string> | null;
  moveTargets: { value: string; label: string }[] | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: (name: string) => void;
  onUpdateCell: (columnId: string, value: string) => void;
  onToggle: () => void;
  onAddInvoice: () => void;
  onDelete: () => void;
  onSetStatus: (status: InvoiceStatus | null) => void;
  onEditDocument: () => void;
  onRemoveDocument: () => void;
  onMoveActuals: (targetId: string) => void;
}

const NEXT_MANUAL_STATUS: Record<InvoiceStatus | 'NONE', InvoiceStatus | null> =
  {
    NONE: 'TO_BE_PAID',
    TO_BE_PAID: 'PAID',
    PAID: null,
  };

const ROW_TONE: Record<RowChange, string> = {
  ADDED: 'bg-lightGreen/40',
  REMOVED: 'bg-darkRed/5 text-dark/50',
  CHANGED: 'bg-white',
};

export function PositionRow({
  position,
  values,
  actuals,
  columns,
  change,
  previousPlan,
  detailed,
  expanded,
  canEditPlan,
  canEditActuals,
  canChangeStatus,
  isEditing,
  folderPaths,
  moveTargets,
  onStartEdit,
  onCancelEdit,
  onRename,
  onUpdateCell,
  onToggle,
  onAddInvoice,
  onDelete,
  onSetStatus,
  onEditDocument,
  onRemoveDocument,
  onMoveActuals,
}: PositionRowProps) {
  const isRemoved = change === 'REMOVED';
  const spend = calcSpend(
    Number(values[PLANNED_COLUMN_ID]) || 0,
    Number(values[SPENT_COLUMN_ID]) || 0,
  );
  const status: InvoiceStatus | null = !detailed
    ? actuals.status
    : actuals.invoices.length === 0
      ? null
      : actuals.invoices.some((invoice) => invoice.status === 'TO_BE_PAID')
        ? 'TO_BE_PAID'
        : 'PAID';
  const nextStatus = NEXT_MANUAL_STATUS[status ?? 'NONE'];
  const statusClasses = status
    ? `rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${INVOICE_STATUS_CLASSES[status]}`
    : '';
  const hasActuals =
    actuals.invoices.length > 0 || (Number(values[SPENT_COLUMN_ID]) || 0) > 0;
  const isCellEditable = (columnId: string) => {
    if (isRemoved) return false;
    if (isPlanField(columnId)) return canEditPlan;
    if (columnId === SPENT_COLUMN_ID) return canEditActuals && !detailed;

    return canEditActuals;
  };
  const menuItems: ActionMenuItem[] = isRemoved
    ? []
    : [
        ...(canEditActuals && detailed
          ? [
              {
                id: 'add-invoice',
                label: 'Dodaj fakturę',
                onSelect: onAddInvoice,
              },
            ]
          : []),
        ...(canEditActuals
          ? [
              {
                id: 'document',
                label: actuals.document ? 'Zmień dokument' : 'Dołącz dokument',
                onSelect: onEditDocument,
              },
            ]
          : []),
        ...(canEditActuals && actuals.document
          ? [
              {
                id: 'remove-document',
                label: 'Odłącz dokument',
                onSelect: onRemoveDocument,
              },
            ]
          : []),
        ...(canEditPlan
          ? [
              {
                id: 'delete',
                label: 'Usuń pozycję',
                tone: 'danger' as const,
                onSelect: onDelete,
              },
            ]
          : []),
      ];

  return (
    <tr
      className={`animate-fade-in group border-b border-gray-100 text-xs font-normal text-dark transition-colors hover:bg-gray-50 ${
        change ? ROW_TONE[change] : 'bg-white'
      }`}
    >
      <td className="py-3 pr-3 pl-5">
        <div className="flex items-center gap-1">
          {detailed && !isRemoved ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? `Zwiń faktury pozycji ${position.name}`
                  : `Rozwiń faktury pozycji ${position.name}`
              }
              className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-darkGreen transition-colors hover:bg-lightGreen focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:outline-none"
            >
              <HiChevronRight
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  expanded ? 'rotate-90' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          ) : (
            <span className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            {isRemoved ? (
              <span className="line-through decoration-1">{position.name}</span>
            ) : (
              <InlineEditField
                value={position.name}
                isEditing={isEditing}
                onStartEdit={onStartEdit}
                onCancel={onCancelEdit}
                onSave={onRename}
                canEdit={canEditPlan}
                saveOnBlur
                ariaLabel={`Nazwa pozycji ${position.name}`}
                emptyMessage="Podaj nazwę pozycji"
                displayClassName="overflow-visible!"
                inputClassName="animate-pop-in -my-0.5 h-5 py-0 text-xs"
              />
            )}
            {actuals.document && !isRemoved && (
              <div className="mt-1">
                <DocumentLinkChip
                  link={actuals.document}
                  folderPaths={folderPaths}
                />
              </div>
            )}
          </div>
          {change && <ChangeTag change={change} className="ml-2" />}
        </div>
      </td>

      {columns.map((column) => {
        const previous = isPlanField(column.id)
          ? previousPlan?.[column.id]
          : undefined;

        return (
          <Fragment key={column.id}>
            <td
              className={`px-3 py-3 whitespace-nowrap ${
                isRemoved ? 'line-through decoration-1' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {previous !== undefined && (
                  <span className="text-dark/50 tabular-nums line-through decoration-1">
                    {formatMoney(previous)}
                  </span>
                )}
                <BudgetCell
                  column={column}
                  value={values[column.id]}
                  positionName={position.name}
                  readOnly={!isCellEditable(column.id)}
                  highlight={previous !== undefined}
                  onSave={(value) => onUpdateCell(column.id, value)}
                />
              </div>
            </td>
            {column.id === SPENT_COLUMN_ID && <RemainingCell spend={spend} />}
          </Fragment>
        );
      })}

      <UsageCell spend={spend} />

      <td className="px-3 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {isRemoved && moveTargets && hasActuals && (
            <Select
              value=""
              onChange={(targetId) => targetId && onMoveActuals(targetId)}
              options={moveTargets}
              placeholder="Przenieś wydatki do…"
            />
          )}
          {!isRemoved && !detailed && canEditActuals && canChangeStatus ? (
            <button
              type="button"
              onClick={() => onSetStatus(nextStatus)}
              aria-label={`Status pozycji ${position.name}: ${
                status ? INVOICE_STATUS_LABELS[status] : 'brak'
              }, kliknij, aby zmienić`}
              className={`cursor-pointer transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:outline-none ${
                status
                  ? statusClasses
                  : 'rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-[11px] whitespace-nowrap text-gray-400'
              }`}
            >
              {status ? INVOICE_STATUS_LABELS[status] : 'Ustaw status'}
            </button>
          ) : (
            status &&
            !isRemoved && (
              <span className={statusClasses}>
                {INVOICE_STATUS_LABELS[status]}
              </span>
            )
          )}
          <ActionMenu
            ariaLabel={`Akcje pozycji ${position.name}`}
            className={`inline-flex h-6 w-6 items-center justify-center ${MENU_REVEAL_CLASSES}`}
            items={menuItems}
          />
        </div>
      </td>
    </tr>
  );
}
