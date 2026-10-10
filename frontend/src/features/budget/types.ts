export type ColumnType = 'text' | 'money' | 'person';

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  locked: boolean;
}

export type InvoiceStatus = 'TO_BE_PAID' | 'PAID';

export type DocumentLink =
  | { kind: 'FOLDER'; folderId: string }
  | { kind: 'FILE'; folderId: string; documentId: string; name: string };

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  contractor: string;
  date: string;
  grant: number;
  ownContribution: number;
  enteredBy: string;
  status: InvoiceStatus;
  document: DocumentLink | null;
}

export type PlanField = 'planned' | 'grant' | 'ownContribution';

export interface PlanPosition {
  id: string;
  name: string;
  planned: number;
  grant: number;
  ownContribution: number;
}

export interface PlanCategory {
  id: string;
  name: string;
  partnerId: string | null;
  positions: PlanPosition[];
}

export type VersionStatus = 'DRAFT' | 'PENDING' | 'APPROVED';

export type RowChange = 'ADDED' | 'REMOVED' | 'CHANGED';

export interface Actor {
  id: string;
  name: string;
}

export interface Rejection {
  by: Actor;
  at: string;
  comment: string;
}

export interface BudgetVersion {
  id: string;
  number: number;
  name: string;
  status: VersionStatus;
  isCurrent: boolean;
  createdBy: Actor;
  createdAt: string;
  submittedBy: Actor | null;
  submittedAt: string | null;
  approvedBy: Actor | null;
  approvedAt: string | null;
  description: string;
  rejections: Rejection[];
  savedAt: string | null;
  categories: PlanCategory[];
}

export interface PositionActuals {
  values: Record<string, string | number>;
  invoices: Invoice[];
  status: InvoiceStatus | null;
  document: DocumentLink | null;
}

export interface CategorySettings {
  detailed: boolean;
  partnerCanEdit: boolean;
  visibleToPartner: boolean;
}

export type HistoryKind =
  | 'CREATED'
  | 'EDITED'
  | 'SUBMITTED'
  | 'WITHDRAWN'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVERTED'
  | 'DISCARDED'
  | 'METADATA_EDITED';

export interface HistoryEntry {
  id: string;
  at: string;
  by: Actor;
  versionId: string;
  versionName: string;
  kind: HistoryKind;
  comment: string | null;
}

export interface BudgetStore {
  columns: Column[];
  versions: BudgetVersion[];
  actuals: Record<string, PositionActuals>;
  categorySettings: Record<string, CategorySettings>;
  history: HistoryEntry[];
}
