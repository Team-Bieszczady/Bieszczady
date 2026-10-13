import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '../../../hooks/useApiMutation';
import { useApiQuery } from '../../../hooks/useApiQuery';
import {
  budgetApi,
  type BackendBudgetStore,
  type BudgetActorRef,
  type BudgetDocumentLinkBody,
} from '../../../lib/projectsApi';
import type { BudgetAction } from '../budgetReducer';
import type {
  Actor,
  BudgetStore,
  DocumentLink,
  HistoryKind,
  PlanCategory,
} from '../types';
import { isPlanField, parseMoney } from '../utils/budgetTotals';

export const budgetKey = (projectId: string) => ['budget', projectId];

const MONEY_ERROR = 'Wpisz kwotę, np. 1500 lub 1500,50';

const UNKNOWN_ACTOR: Actor = { id: '', name: '—' };

function toActor(actor: BudgetActorRef | null): Actor {
  return actor ?? UNKNOWN_ACTOR;
}

function toStore(store: BackendBudgetStore): BudgetStore {
  const moneyColumns = new Set(
    store.columns
      .filter((column) => column.type === 'money')
      .map((column) => column.id),
  );

  return {
    columns: store.columns,
    versions: store.versions.map((version) => ({
      ...version,
      createdBy: toActor(version.createdBy),
      rejections: version.rejections.map((rejection) => ({
        ...rejection,
        by: toActor(rejection.by),
      })),
      categories: version.categories.map(
        (category): PlanCategory => ({
          ...category,
          positions: category.positions.map((position) => ({
            ...position,
            planned: Number(position.planned),
            grant: Number(position.grant),
            ownContribution: Number(position.ownContribution),
          })),
        }),
      ),
    })),
    actuals: Object.fromEntries(
      Object.entries(store.actuals).map(([positionId, actuals]) => [
        positionId,
        {
          ...actuals,
          values: Object.fromEntries(
            Object.entries(actuals.values).map(([columnId, value]) => [
              columnId,
              moneyColumns.has(columnId) && value !== ''
                ? Number(value)
                : value,
            ]),
          ),
          invoices: actuals.invoices.map((invoice) => ({
            ...invoice,
            amount: Number(invoice.amount),
            grant: Number(invoice.grant),
            ownContribution: Number(invoice.ownContribution),
          })),
        },
      ]),
    ),
    categorySettings: store.categorySettings,
    history: store.history.map((entry) => ({
      ...entry,
      by: toActor(entry.by),
      kind: entry.kind as HistoryKind,
    })),
    permissions: store.permissions,
    partners: store.partners,
  };
}

function toMoney(input: string, emptyAs: string): string {
  const trimmed = input.trim();
  if (trimmed === '') return emptyAs;

  const value = parseMoney(trimmed);
  if (value === null) throw new Error(MONEY_ERROR);
  return value.toFixed(2);
}

function toLinkBody(
  document: DocumentLink | null,
): BudgetDocumentLinkBody | null {
  if (!document) return null;

  return document.kind === 'FILE'
    ? {
        kind: 'FILE',
        folderId: document.folderId,
        documentId: document.documentId,
      }
    : { kind: 'FOLDER', folderId: document.folderId };
}

export function useBudget(
  projectId: string,
  options: { enabled?: boolean } = {},
) {
  return useApiQuery(
    budgetKey(projectId),
    async (token) => toStore(await budgetApi.get(token, projectId)),
    options,
  );
}

export function useBudgetAction(projectId: string) {
  const queryClient = useQueryClient();

  return useApiMutation(
    async (token, action: BudgetAction): Promise<{ id: string } | void> => {
      switch (action.type) {
        case 'ADD_CATEGORY':
          return budgetApi.createCategory(token, action.versionId, {
            name: action.name,
            partnerId: action.partnerId,
          });
        case 'UPDATE_CATEGORY':
          await budgetApi.patchCategory(
            token,
            action.versionId,
            action.categoryId,
            { name: action.name, partnerId: action.partnerId },
          );
          return;
        case 'RENAME_CATEGORY':
          await budgetApi.patchCategory(
            token,
            action.versionId,
            action.categoryId,
            { name: action.name },
          );
          return;
        case 'DELETE_CATEGORY':
          return budgetApi.removeCategory(
            token,
            action.versionId,
            action.categoryId,
          );
        case 'ADD_POSITION':
          return budgetApi.createPosition(
            token,
            action.versionId,
            action.categoryId,
            { name: action.name },
          );
        case 'RENAME_POSITION':
          await budgetApi.patchPosition(
            token,
            action.versionId,
            action.positionId,
            { name: action.name },
          );
          return;
        case 'SET_POSITION_PARTNER':
          await budgetApi.patchPosition(
            token,
            action.versionId,
            action.positionId,
            { partnerId: action.partnerId },
          );
          return;
        case 'DELETE_POSITION':
          return budgetApi.removePosition(
            token,
            action.versionId,
            action.positionId,
          );
        case 'UPDATE_PLAN':
          await budgetApi.patchPosition(
            token,
            action.versionId,
            action.positionId,
            { [action.field]: toMoney(action.value, '0') },
          );
          return;
        case 'UPDATE_CELL': {
          if (isPlanField(action.columnId)) return;
          const column = queryClient
            .getQueryData<BudgetStore>(budgetKey(projectId))
            ?.columns.find(({ id }) => id === action.columnId);

          return budgetApi.setCell(
            token,
            projectId,
            action.positionId,
            action.columnId,
            column?.type === 'money'
              ? toMoney(action.value, '')
              : action.value.trim(),
          );
        }
        case 'ADD_INVOICE':
          await budgetApi.addInvoice(token, projectId, action.positionId, {
            number: action.invoice.number,
            contractor: action.invoice.contractor,
            date: action.invoice.date,
            amount: action.invoice.amount.toFixed(2),
            grant: action.invoice.grant.toFixed(2),
            ownContribution: action.invoice.ownContribution.toFixed(2),
            document: toLinkBody(action.invoice.document),
          });
          return;
        case 'SET_INVOICE_STATUS':
          return budgetApi.setInvoiceStatus(
            token,
            action.invoiceId,
            action.status,
          );
        case 'DELETE_INVOICE':
          return budgetApi.removeInvoice(token, action.invoiceId);
        case 'RECALC_FROM_INVOICES':
          return budgetApi.recalculate(token, projectId, action.positionId);
        case 'SET_POSITION_STATUS':
          return budgetApi.patchActual(token, projectId, action.positionId, {
            status: action.status,
          });
        case 'SET_POSITION_DOCUMENT':
          return budgetApi.patchActual(token, projectId, action.positionId, {
            document: toLinkBody(action.document),
          });
        case 'MOVE_ACTUALS':
          return budgetApi.moveActuals(token, projectId, {
            fromPositionKey: action.fromPositionId,
            toPositionKey: action.toPositionId,
          });
        case 'SET_PARTNER_FLAG':
          await budgetApi.patchCategorySettings(
            token,
            projectId,
            action.categoryId,
            { [action.flag]: action.value },
          );
          return;
        case 'SET_CATEGORY_DOCUMENT':
          await budgetApi.patchCategorySettings(
            token,
            projectId,
            action.categoryId,
            { document: toLinkBody(action.document) },
          );
          return;
        case 'CREATE_ANNEX':
          return budgetApi.createAnnex(token, projectId);
        case 'SUBMIT':
          return budgetApi.submit(token, action.versionId);
        case 'WITHDRAW':
          return budgetApi.withdraw(token, action.versionId);
        case 'APPROVE':
          return budgetApi.approve(
            token,
            action.versionId,
            action.description.trim(),
          );
        case 'REJECT':
          return budgetApi.reject(
            token,
            action.versionId,
            action.comment.trim(),
          );
        case 'REVERT_APPROVAL':
          return budgetApi.revert(
            token,
            action.versionId,
            action.reason.trim(),
          );
        case 'DISCARD_DRAFT':
          return budgetApi.discard(token, action.versionId);
        case 'EDIT_METADATA':
          return budgetApi.editDescription(
            token,
            action.versionId,
            action.description.trim(),
          );
        case 'ADD_COLUMN':
          await budgetApi.createColumn(token, projectId, {
            name: action.name,
            type: action.columnType,
          });
          return;
        case 'RENAME_COLUMN':
          await budgetApi.renameColumn(
            token,
            projectId,
            action.columnId,
            action.name,
          );
          return;
        case 'DELETE_COLUMN':
          return budgetApi.removeColumn(token, projectId, action.columnId);
      }
    },
    { invalidates: [budgetKey(projectId)] },
  );
}
