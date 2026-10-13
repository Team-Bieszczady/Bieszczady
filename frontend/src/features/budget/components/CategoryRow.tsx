import { Fragment } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { HiChevronRight } from 'react-icons/hi';
import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../components/ui/ActionMenu';
import { InlineEditField } from '../../../components/ui/InlineEditField';
import type { PartnerFlag } from '../budgetReducer';
import type {
  CategorySettings,
  Column,
  PlanCategory,
  RowChange,
} from '../types';
import {
  PLANNED_COLUMN_ID,
  SPENT_COLUMN_ID,
  calcSpend,
  formatMoney,
  type Totals,
} from '../utils/budgetTotals';
import { MENU_REVEAL_CLASSES, moneyEmphasis } from '../styles';
import { ChangeTag } from './ChangeTag';
import { DocumentLinkChip } from './DocumentLinkChip';
import { RemainingCell, UsageCell } from './SpendCells';

interface CategoryRowProps {
  category: PlanCategory;
  columns: Column[];
  totals: Totals;
  previousTotals: Totals | null;
  change: RowChange | null;
  settings: CategorySettings;
  partnerName: string | null;
  folderPaths: Map<string, string> | null;
  expanded: boolean;
  canEditPlan: boolean;
  canEditActuals: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRename: (name: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onShare: () => void;
  onRemovePartner: () => void;
  onEditDocument: () => void;
  onRemoveDocument: () => void;
  onTogglePartnerFlag: (flag: PartnerFlag) => void;
}

export function CategoryRow({
  category,
  columns,
  totals,
  previousTotals,
  change,
  settings,
  partnerName,
  folderPaths,
  expanded,
  canEditPlan,
  canEditActuals,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onRename,
  onToggle,
  onDelete,
  onShare,
  onRemovePartner,
  onEditDocument,
  onRemoveDocument,
  onTogglePartnerFlag,
}: CategoryRowProps) {
  const isRemoved = change === 'REMOVED';
  const spend = calcSpend(totals[PLANNED_COLUMN_ID], totals[SPENT_COLUMN_ID]);
  const isEmpty = category.positions.length === 0;
  const hasPartner = category.partnerId !== null;
  const menuItems: ActionMenuItem[] = isRemoved
    ? []
    : [
        ...(canEditPlan
          ? [
              { id: 'rename', label: 'Zmień nazwę', onSelect: onStartEdit },
              hasPartner
                ? {
                    id: 'remove-partner',
                    label: 'Usuń partnera',
                    onSelect: onRemovePartner,
                  }
                : {
                    id: 'share',
                    label: 'Udostępnij partnerowi',
                    onSelect: onShare,
                  },
            ]
          : []),
        ...(canEditActuals && hasPartner
          ? [
              {
                id: 'toggle-edit',
                label: settings.partnerCanEdit
                  ? 'Zablokuj edycję partnerowi'
                  : 'Pozwól partnerowi edytować',
                onSelect: () => onTogglePartnerFlag('partnerCanEdit'),
              },
              {
                id: 'toggle-detailed',
                label: settings.detailed
                  ? 'Wyłącz tabelę szczegółową'
                  : 'Włącz tabelę szczegółową',
                onSelect: () => onTogglePartnerFlag('detailed'),
              },
            ]
          : []),
        ...(canEditActuals
          ? [
              {
                id: 'document',
                label: settings.document ? 'Zmień dokument' : 'Dodaj dokument',
                onSelect: onEditDocument,
              },
            ]
          : []),
        ...(canEditActuals && settings.document
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
                label: 'Usuń kategorię',
                tone: 'danger' as const,
                onSelect: onDelete,
              },
            ]
          : []),
      ];

  return (
    <tr
      className={`animate-fade-in group border-b border-gray-200 text-xs text-dark transition-colors hover:bg-gray-50 ${
        change === 'ADDED'
          ? 'bg-lightGreen/40'
          : isRemoved
            ? 'bg-darkRed/5 text-dark/50'
            : 'bg-white'
      }`}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Zwiń kategorię ${category.name}`
                : `Rozwiń kategorię ${category.name}`
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
          <div className="min-w-0">
            {isRemoved ? (
              <span className="font-semibold line-through decoration-1">
                {category.name}
              </span>
            ) : (
              <InlineEditField
                value={category.name}
                isEditing={isEditing}
                onStartEdit={onStartEdit}
                onCancel={onCancelEdit}
                onSave={onRename}
                canEdit={canEditPlan}
                saveOnBlur
                ariaLabel={`Nazwa kategorii ${category.name}`}
                emptyMessage="Podaj nazwę kategorii"
                displayClassName="font-semibold overflow-visible!"
                inputClassName="animate-pop-in -my-0.5 h-5 py-0 text-xs font-semibold"
              />
            )}
            {settings.document && !isRemoved && (
              <div className="mt-1">
                <DocumentLinkChip
                  link={settings.document}
                  folderPaths={folderPaths}
                />
              </div>
            )}
          </div>
          {change && change !== 'CHANGED' && (
            <ChangeTag change={change} className="ml-2" />
          )}
          {hasPartner && (
            <div className="ml-2 flex shrink-0 items-center gap-1.5">
              <span className="rounded-md border border-darkGreen bg-white px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-darkGreen">
                Partner: {partnerName ?? 'nieznany'}
              </span>
              {canEditActuals && !isRemoved ? (
                <button
                  type="button"
                  onClick={() => onTogglePartnerFlag('visibleToPartner')}
                  aria-pressed={settings.visibleToPartner}
                  title={
                    settings.visibleToPartner
                      ? 'Kliknij, aby ukryć dane przed partnerem'
                      : 'Kliknij, aby pokazać dane partnerowi'
                  }
                  className={`inline-grid cursor-pointer rounded-md border bg-white px-2 py-0.5 text-[11px] font-medium whitespace-nowrap transition-colors duration-300 ease-in-out hover:opacity-80 focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:outline-none ${
                    settings.visibleToPartner
                      ? 'border-darkGreen text-darkGreen'
                      : 'border-amberDark text-amberDark'
                  }`}
                >
                  <span
                    aria-hidden={!settings.visibleToPartner}
                    className={`inline-flex items-center gap-1 transition-opacity duration-300 ease-in-out [grid-area:1/1] ${
                      settings.visibleToPartner ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <FiEye className="h-3 w-3" aria-hidden="true" />
                    Widoczne dla partnera
                  </span>
                  <span
                    aria-hidden={settings.visibleToPartner}
                    className={`inline-flex items-center gap-1 transition-opacity duration-300 ease-in-out [grid-area:1/1] ${
                      settings.visibleToPartner ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <FiEyeOff className="h-3 w-3" aria-hidden="true" />
                    Ukryte przed partnerem
                  </span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </td>

      {columns.map((column) => {
        const previous = previousTotals?.[column.id];
        const isChanged =
          column.type === 'money' &&
          previousTotals !== null &&
          previous !== totals[column.id];

        return (
          <Fragment key={column.id}>
            <td
              className={`px-3 py-3 whitespace-nowrap ${
                isRemoved ? 'line-through decoration-1' : ''
              } ${
                column.type === 'money'
                  ? `tabular-nums ${isChanged ? 'font-semibold text-amberDark' : moneyEmphasis(column)}`
                  : 'text-gray-400'
              }`}
            >
              {isChanged && (
                <span className="mr-2 font-normal text-dark/50 line-through decoration-1">
                  {formatMoney(previous)}
                </span>
              )}
              {column.type === 'money' ? formatMoney(totals[column.id]) : '—'}
            </td>
            {column.id === SPENT_COLUMN_ID && (
              <RemainingCell spend={spend} isEmpty={isEmpty} />
            )}
          </Fragment>
        );
      })}

      <UsageCell spend={spend} isEmpty={isEmpty} />

      <td className="px-3 py-3 text-right">
        <ActionMenu
          ariaLabel={`Akcje kategorii ${category.name}`}
          className={`inline-flex h-6 w-6 items-center justify-center ${MENU_REVEAL_CLASSES}`}
          items={menuItems}
        />
      </td>
    </tr>
  );
}
