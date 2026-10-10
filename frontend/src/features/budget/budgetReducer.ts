import type { AuthenticatedUser } from '../../lib/api';
import type {
  Actor,
  BudgetStore,
  BudgetVersion,
  CategorySettings,
  ColumnType,
  DocumentLink,
  HistoryEntry,
  HistoryKind,
  Invoice,
  InvoiceStatus,
  PlanCategory,
  PlanField,
  PlanPosition,
  PositionActuals,
} from './types';
import {
  EMPTY_ACTUALS,
  SPENT_COLUMN_ID,
  calcInvoicesTotal,
  currentVersion,
  diffVersions,
  isPlanField,
  parseMoney,
} from './utils/budgetTotals';

type PartnerFlag = keyof CategorySettings;

export interface ActionMeta {
  actor: Actor;
  canApprove: boolean;
  at: string;
}

export interface AnnexMetadata {
  description: string;
}

export type BudgetAction =
  | {
      type: 'ADD_CATEGORY';
      versionId: string;
      id: string;
      name: string;
      partnerId: string | null;
    }
  | {
      type: 'UPDATE_CATEGORY';
      versionId: string;
      categoryId: string;
      name: string;
      partnerId: string | null;
    }
  | {
      type: 'RENAME_CATEGORY';
      versionId: string;
      categoryId: string;
      name: string;
    }
  | { type: 'DELETE_CATEGORY'; versionId: string; categoryId: string }
  | {
      type: 'ADD_POSITION';
      versionId: string;
      categoryId: string;
      id: string;
      name: string;
    }
  | {
      type: 'RENAME_POSITION';
      versionId: string;
      categoryId: string;
      positionId: string;
      name: string;
    }
  | {
      type: 'DELETE_POSITION';
      versionId: string;
      categoryId: string;
      positionId: string;
    }
  | {
      type: 'UPDATE_PLAN';
      versionId: string;
      categoryId: string;
      positionId: string;
      field: PlanField;
      value: string;
    }
  | {
      type: 'UPDATE_CELL';
      categoryId: string;
      positionId: string;
      columnId: string;
      value: string;
    }
  | { type: 'ADD_INVOICE'; positionId: string; invoice: Invoice }
  | {
      type: 'SET_INVOICE_STATUS';
      positionId: string;
      invoiceId: string;
      status: InvoiceStatus;
    }
  | { type: 'DELETE_INVOICE'; positionId: string; invoiceId: string }
  | { type: 'RECALC_FROM_INVOICES'; positionId: string }
  | {
      type: 'SET_POSITION_STATUS';
      positionId: string;
      status: InvoiceStatus | null;
    }
  | {
      type: 'SET_POSITION_DOCUMENT';
      positionId: string;
      document: DocumentLink | null;
    }
  | { type: 'MOVE_ACTUALS'; fromPositionId: string; toPositionId: string }
  | { type: 'TOGGLE_PARTNER_FLAG'; categoryId: string; flag: PartnerFlag }
  | { type: 'CREATE_ANNEX'; id: string }
  | { type: 'SUBMIT'; versionId: string }
  | { type: 'WITHDRAW'; versionId: string }
  | ({ type: 'APPROVE'; versionId: string } & AnnexMetadata)
  | { type: 'REJECT'; versionId: string; comment: string }
  | { type: 'REVERT_APPROVAL'; versionId: string; reason: string }
  | { type: 'DISCARD_DRAFT'; versionId: string }
  | ({ type: 'EDIT_METADATA'; versionId: string } & AnnexMetadata)
  | { type: 'ADD_COLUMN'; id: string; name: string; columnType: ColumnType }
  | { type: 'RENAME_COLUMN'; columnId: string; name: string }
  | { type: 'DELETE_COLUMN'; columnId: string };

const EDIT_MERGE_WINDOW_MS = 30 * 60 * 1000;

export const DEFAULT_SETTINGS: CategorySettings = {
  detailed: true,
  partnerCanEdit: false,
  visibleToPartner: false,
};

export function canApproveAnnexes(user: AuthenticatedUser | null): boolean {
  return !!user?.isDirector;
}

export function annexName(number: number): string {
  return number === 0 ? 'Wersja podstawowa' : `Aneks ${number}`;
}

export function settingsOf(
  store: BudgetStore,
  categoryId: string,
): CategorySettings {
  return store.categorySettings[categoryId] ?? DEFAULT_SETTINGS;
}

export function isSummaryMode(
  store: BudgetStore,
  category: PlanCategory,
): boolean {
  return (
    category.partnerId !== null && !settingsOf(store, category.id).detailed
  );
}

export function openAnnex(store: BudgetStore): BudgetVersion | null {
  return (
    store.versions.find(
      (version) => version.status === 'DRAFT' || version.status === 'PENDING',
    ) ?? null
  );
}

export function latestApproved(store: BudgetStore): BudgetVersion {
  return store.versions
    .filter((version) => version.status === 'APPROVED')
    .sort((a, b) => b.number - a.number)[0];
}

export function versionHasChanges(
  store: BudgetStore,
  version: BudgetVersion,
): boolean {
  return diffVersions(currentVersion(store).categories, version.categories)
    .hasChanges;
}

function findCategoryInCurrent(
  store: BudgetStore,
  positionId: string,
): PlanCategory | null {
  return (
    currentVersion(store).categories.find((category) =>
      category.positions.some(({ id }) => id === positionId),
    ) ?? null
  );
}

function log(
  store: BudgetStore,
  meta: ActionMeta,
  version: BudgetVersion,
  kind: HistoryKind,
  comment: string | null = null,
): HistoryEntry[] {
  const last = store.history.at(-1);
  if (
    kind === 'EDITED' &&
    last?.kind === 'EDITED' &&
    last.versionId === version.id &&
    last.by.id === meta.actor.id &&
    Date.parse(meta.at) - Date.parse(last.at) < EDIT_MERGE_WINDOW_MS
  ) {
    return [...store.history.slice(0, -1), { ...last, at: meta.at }];
  }

  return [
    ...store.history,
    {
      id: crypto.randomUUID(),
      at: meta.at,
      by: meta.actor,
      versionId: version.id,
      versionName: version.name,
      kind,
      comment,
    },
  ];
}

function withVersion(
  store: BudgetStore,
  versionId: string,
  update: (version: BudgetVersion) => BudgetVersion,
): BudgetStore {
  return {
    ...store,
    versions: store.versions.map((version) =>
      version.id === versionId ? update(version) : version,
    ),
  };
}

function editPlan(
  store: BudgetStore,
  versionId: string,
  meta: ActionMeta,
  update: (categories: PlanCategory[]) => PlanCategory[],
): BudgetStore {
  const version = store.versions.find(({ id }) => id === versionId);
  if (!version || version.status !== 'DRAFT') return store;

  return {
    ...withVersion(store, versionId, (draft) => ({
      ...draft,
      savedAt: meta.at,
      categories: update(draft.categories),
    })),
    history: log(store, meta, version, 'EDITED'),
  };
}

function mapCategory(
  categories: PlanCategory[],
  categoryId: string,
  update: (category: PlanCategory) => PlanCategory,
): PlanCategory[] {
  return categories.map((category) =>
    category.id === categoryId ? update(category) : category,
  );
}

function mapPosition(
  categories: PlanCategory[],
  categoryId: string,
  positionId: string,
  update: (position: PlanPosition) => PlanPosition,
): PlanCategory[] {
  return mapCategory(categories, categoryId, (category) => ({
    ...category,
    positions: category.positions.map((position) =>
      position.id === positionId ? update(position) : position,
    ),
  }));
}

function editActuals(
  store: BudgetStore,
  positionId: string,
  update: (actuals: PositionActuals) => PositionActuals,
): BudgetStore {
  if (!findCategoryInCurrent(store, positionId)) return store;

  return {
    ...store,
    actuals: {
      ...store.actuals,
      [positionId]: update(store.actuals[positionId] ?? EMPTY_ACTUALS),
    },
  };
}

function spentOf(actuals: PositionActuals): number {
  return Number(actuals.values[SPENT_COLUMN_ID]) || 0;
}

function withSpent(actuals: PositionActuals, spent: number): PositionActuals {
  return {
    ...actuals,
    values: { ...actuals.values, [SPENT_COLUMN_ID]: spent },
  };
}

export function budgetReducer(
  store: BudgetStore,
  action: BudgetAction,
  meta: ActionMeta,
): BudgetStore {
  switch (action.type) {
    case 'ADD_CATEGORY':
      return editPlan(store, action.versionId, meta, (categories) => [
        ...categories,
        {
          id: action.id,
          name: action.name,
          partnerId: action.partnerId,
          positions: [],
        },
      ]);

    case 'UPDATE_CATEGORY':
      return editPlan(store, action.versionId, meta, (categories) =>
        mapCategory(categories, action.categoryId, (category) => ({
          ...category,
          name: action.name,
          partnerId: action.partnerId,
        })),
      );

    case 'RENAME_CATEGORY':
      return editPlan(store, action.versionId, meta, (categories) =>
        mapCategory(categories, action.categoryId, (category) => ({
          ...category,
          name: action.name,
        })),
      );

    case 'DELETE_CATEGORY':
      return editPlan(store, action.versionId, meta, (categories) =>
        categories.filter(({ id }) => id !== action.categoryId),
      );

    case 'ADD_POSITION':
      return editPlan(store, action.versionId, meta, (categories) =>
        mapCategory(categories, action.categoryId, (category) => ({
          ...category,
          positions: [
            ...category.positions,
            {
              id: action.id,
              name: action.name,
              planned: 0,
              grant: 0,
              ownContribution: 0,
            },
          ],
        })),
      );

    case 'RENAME_POSITION':
      return editPlan(store, action.versionId, meta, (categories) =>
        mapPosition(
          categories,
          action.categoryId,
          action.positionId,
          (position) => ({ ...position, name: action.name }),
        ),
      );

    case 'DELETE_POSITION':
      return editPlan(store, action.versionId, meta, (categories) =>
        mapCategory(categories, action.categoryId, (category) => ({
          ...category,
          positions: category.positions.filter(
            ({ id }) => id !== action.positionId,
          ),
        })),
      );

    case 'UPDATE_PLAN': {
      const trimmed = action.value.trim();
      const value = trimmed === '' ? 0 : parseMoney(trimmed);
      if (value === null) return store;

      return editPlan(store, action.versionId, meta, (categories) =>
        mapPosition(
          categories,
          action.categoryId,
          action.positionId,
          (position) => ({ ...position, [action.field]: value }),
        ),
      );
    }

    case 'UPDATE_CELL': {
      const column = store.columns.find(({ id }) => id === action.columnId);
      const category = findCategoryInCurrent(store, action.positionId);
      if (!column || !category || isPlanField(column.id)) return store;
      if (column.id === SPENT_COLUMN_ID && !isSummaryMode(store, category)) {
        return store;
      }

      const trimmed = action.value.trim();
      const value =
        column.type === 'money' && trimmed !== ''
          ? parseMoney(trimmed)
          : trimmed;
      if (value === null) return store;

      return editActuals(store, action.positionId, (actuals) => ({
        ...actuals,
        values: { ...actuals.values, [action.columnId]: value },
      }));
    }

    case 'ADD_INVOICE':
      return editActuals(store, action.positionId, (actuals) =>
        withSpent(
          { ...actuals, invoices: [...actuals.invoices, action.invoice] },
          spentOf(actuals) + action.invoice.amount,
        ),
      );

    case 'SET_INVOICE_STATUS':
      return editActuals(store, action.positionId, (actuals) => ({
        ...actuals,
        invoices: actuals.invoices.map((invoice) =>
          invoice.id === action.invoiceId
            ? { ...invoice, status: action.status }
            : invoice,
        ),
      }));

    case 'DELETE_INVOICE':
      return editActuals(store, action.positionId, (actuals) => {
        const removed = actuals.invoices.find(
          ({ id }) => id === action.invoiceId,
        );
        if (!removed) return actuals;

        return withSpent(
          {
            ...actuals,
            invoices: actuals.invoices.filter(
              ({ id }) => id !== action.invoiceId,
            ),
          },
          spentOf(actuals) - removed.amount,
        );
      });

    case 'RECALC_FROM_INVOICES':
      return editActuals(store, action.positionId, (actuals) =>
        withSpent(actuals, calcInvoicesTotal(actuals)),
      );

    case 'SET_POSITION_STATUS':
      return editActuals(store, action.positionId, (actuals) => ({
        ...actuals,
        status: action.status,
      }));

    case 'SET_POSITION_DOCUMENT':
      return editActuals(store, action.positionId, (actuals) => ({
        ...actuals,
        document: action.document,
      }));

    case 'MOVE_ACTUALS': {
      const source = store.actuals[action.fromPositionId];
      if (
        !source ||
        action.fromPositionId === action.toPositionId ||
        !findCategoryInCurrent(store, action.fromPositionId) ||
        !findCategoryInCurrent(store, action.toPositionId)
      ) {
        return store;
      }
      const target = store.actuals[action.toPositionId] ?? EMPTY_ACTUALS;

      return {
        ...store,
        actuals: {
          ...store.actuals,
          [action.fromPositionId]: withSpent({ ...source, invoices: [] }, 0),
          [action.toPositionId]: withSpent(
            { ...target, invoices: [...target.invoices, ...source.invoices] },
            spentOf(target) + spentOf(source),
          ),
        },
      };
    }

    case 'TOGGLE_PARTNER_FLAG': {
      const settings = settingsOf(store, action.categoryId);

      return {
        ...store,
        categorySettings: {
          ...store.categorySettings,
          [action.categoryId]: {
            ...settings,
            [action.flag]: !settings[action.flag],
          },
        },
      };
    }

    case 'CREATE_ANNEX': {
      if (openAnnex(store)) return store;

      const number = latestApproved(store).number + 1;
      const draft: BudgetVersion = {
        id: action.id,
        number,
        name: annexName(number),
        status: 'DRAFT',
        isCurrent: false,
        createdBy: meta.actor,
        createdAt: meta.at,
        submittedBy: null,
        submittedAt: null,
        approvedBy: null,
        approvedAt: null,
        description: '',
        rejections: [],
        savedAt: null,
        categories: structuredClone(currentVersion(store).categories),
      };

      return {
        ...store,
        versions: [...store.versions, draft],
        history: log(store, meta, draft, 'CREATED'),
      };
    }

    case 'SUBMIT': {
      const version = store.versions.find(({ id }) => id === action.versionId);
      if (
        !version ||
        version.status !== 'DRAFT' ||
        !versionHasChanges(store, version)
      ) {
        return store;
      }

      return {
        ...withVersion(store, version.id, (draft) => ({
          ...draft,
          status: 'PENDING',
          submittedBy: meta.actor,
          submittedAt: meta.at,
        })),
        history: log(store, meta, version, 'SUBMITTED'),
      };
    }

    case 'WITHDRAW': {
      const version = store.versions.find(({ id }) => id === action.versionId);
      if (!version || version.status !== 'PENDING') return store;

      return {
        ...withVersion(store, version.id, (pending) => ({
          ...pending,
          status: 'DRAFT',
        })),
        history: log(store, meta, version, 'WITHDRAWN'),
      };
    }

    case 'APPROVE': {
      const version = store.versions.find(({ id }) => id === action.versionId);
      const ownDraft =
        version?.status === 'DRAFT' && version.createdBy.id === meta.actor.id;
      if (
        !meta.canApprove ||
        !version ||
        !(version.status === 'PENDING' || ownDraft) ||
        !versionHasChanges(store, version) ||
        action.description.trim() === ''
      ) {
        return store;
      }

      return {
        ...store,
        versions: store.versions.map((candidate) =>
          candidate.id === version.id
            ? {
                ...candidate,
                status: 'APPROVED',
                isCurrent: true,
                approvedBy: meta.actor,
                approvedAt: meta.at,
                description: action.description.trim(),
              }
            : { ...candidate, isCurrent: false },
        ),
        history: log(
          store,
          meta,
          version,
          'APPROVED',
          action.description.trim(),
        ),
      };
    }

    case 'REJECT': {
      const version = store.versions.find(({ id }) => id === action.versionId);
      const comment = action.comment.trim();
      if (
        !meta.canApprove ||
        !version ||
        version.status !== 'PENDING' ||
        comment === ''
      ) {
        return store;
      }

      return {
        ...withVersion(store, version.id, (pending) => ({
          ...pending,
          status: 'DRAFT',
          rejections: [
            ...pending.rejections,
            { by: meta.actor, at: meta.at, comment },
          ],
        })),
        history: log(store, meta, version, 'REJECTED', comment),
      };
    }

    case 'REVERT_APPROVAL': {
      const version = store.versions.find(({ id }) => id === action.versionId);
      const reason = action.reason.trim();
      if (
        !meta.canApprove ||
        !version ||
        version.number === 0 ||
        version.id !== latestApproved(store).id ||
        openAnnex(store) ||
        reason === ''
      ) {
        return store;
      }
      const restored = store.versions
        .filter(
          (candidate) =>
            candidate.status === 'APPROVED' &&
            candidate.number < version.number,
        )
        .sort((a, b) => b.number - a.number)[0];

      return {
        ...store,
        versions: store.versions.map((candidate) =>
          candidate.id === version.id
            ? {
                ...candidate,
                status: 'DRAFT',
                isCurrent: false,
                approvedBy: null,
                approvedAt: null,
              }
            : { ...candidate, isCurrent: candidate.id === restored.id },
        ),
        history: log(store, meta, version, 'REVERTED', reason),
      };
    }

    case 'DISCARD_DRAFT': {
      const version = store.versions.find(({ id }) => id === action.versionId);
      if (!version || version.status !== 'DRAFT') return store;

      return {
        ...store,
        versions: store.versions.filter(({ id }) => id !== version.id),
        history: log(store, meta, version, 'DISCARDED'),
      };
    }

    case 'EDIT_METADATA': {
      const version = store.versions.find(({ id }) => id === action.versionId);
      if (
        !version ||
        version.status !== 'APPROVED' ||
        action.description.trim() === ''
      ) {
        return store;
      }

      return {
        ...withVersion(store, version.id, (approved) => ({
          ...approved,
          description: action.description.trim(),
        })),
        history: log(
          store,
          meta,
          version,
          'METADATA_EDITED',
          action.description.trim(),
        ),
      };
    }

    case 'ADD_COLUMN':
      return {
        ...store,
        columns: [
          ...store.columns,
          {
            id: action.id,
            name: action.name,
            type: action.columnType,
            locked: false,
          },
        ],
      };

    case 'RENAME_COLUMN':
      return {
        ...store,
        columns: store.columns.map((column) =>
          column.id === action.columnId && !column.locked
            ? { ...column, name: action.name }
            : column,
        ),
      };

    case 'DELETE_COLUMN': {
      const column = store.columns.find(({ id }) => id === action.columnId);
      if (!column || column.locked) return store;

      return {
        ...store,
        columns: store.columns.filter(({ id }) => id !== action.columnId),
        actuals: Object.fromEntries(
          Object.entries(store.actuals).map(([positionId, actuals]) => [
            positionId,
            {
              ...actuals,
              values: Object.fromEntries(
                Object.entries(actuals.values).filter(
                  ([columnId]) => columnId !== action.columnId,
                ),
              ),
            },
          ]),
        ),
      };
    }
  }
}
