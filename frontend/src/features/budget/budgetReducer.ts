import type {
  BudgetStore,
  BudgetVersion,
  CategorySettings,
  ColumnType,
  DocumentLink,
  Invoice,
  InvoiceStatus,
  PlanCategory,
  PlanField,
} from './types';

export type PartnerFlag = Exclude<keyof CategorySettings, 'document'>;

export interface AnnexMetadata {
  description: string;
}

export type InvoiceInput = Omit<Invoice, 'id' | 'enteredBy' | 'status'>;

export type BudgetAction =
  | {
      type: 'ADD_CATEGORY';
      versionId: string;
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
      type: 'SET_POSITION_PARTNER';
      versionId: string;
      categoryId: string;
      positionId: string;
      partnerId: string | null;
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
  | { type: 'ADD_INVOICE'; positionId: string; invoice: InvoiceInput }
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
  | {
      type: 'SET_PARTNER_FLAG';
      categoryId: string;
      flag: PartnerFlag;
      value: boolean;
    }
  | {
      type: 'SET_CATEGORY_DOCUMENT';
      categoryId: string;
      document: DocumentLink | null;
    }
  | { type: 'CREATE_ANNEX' }
  | { type: 'SUBMIT'; versionId: string }
  | { type: 'WITHDRAW'; versionId: string }
  | ({ type: 'APPROVE'; versionId: string } & AnnexMetadata)
  | { type: 'REJECT'; versionId: string; comment: string }
  | { type: 'REVERT_APPROVAL'; versionId: string; reason: string }
  | { type: 'DISCARD_DRAFT'; versionId: string }
  | ({ type: 'EDIT_METADATA'; versionId: string } & AnnexMetadata)
  | { type: 'ADD_COLUMN'; name: string; columnType: ColumnType }
  | { type: 'RENAME_COLUMN'; columnId: string; name: string }
  | { type: 'DELETE_COLUMN'; columnId: string };

export type BudgetDispatch = (
  action: BudgetAction,
  onDone?: (id: string | null) => void,
) => void;

export const DEFAULT_SETTINGS: CategorySettings = {
  detailed: true,
  partnerCanEdit: false,
  visibleToPartner: false,
  document: null,
};

export function settingsOf(
  store: BudgetStore,
  categoryId: string,
): CategorySettings {
  return store.categorySettings[categoryId] ?? DEFAULT_SETTINGS;
}

export function isSummaryMode(
  store: BudgetStore,
  category: PlanCategory,
  rowPartnerId: string | null = category.partnerId,
): boolean {
  return rowPartnerId !== null && !settingsOf(store, category.id).detailed;
}

export function canEditCategoryActuals(
  store: BudgetStore,
  category: PlanCategory,
  rowPartnerId: string | null = category.partnerId,
): boolean {
  const { canEdit, partnerId } = store.permissions;

  return (
    canEdit ||
    (partnerId !== null &&
      rowPartnerId === partnerId &&
      settingsOf(store, category.id).partnerCanEdit)
  );
}

export function openAnnex(store: BudgetStore): BudgetVersion | null {
  return (
    store.versions.find(
      (version) => version.status === 'DRAFT' || version.status === 'PENDING',
    ) ?? null
  );
}

export function latestApproved(store: BudgetStore): BudgetVersion | null {
  return (
    store.versions
      .filter((version) => version.status === 'APPROVED')
      .sort((a, b) => b.number - a.number)[0] ?? null
  );
}
