export const DOCUMENT_KINDS = [
  'CONTRACT',
  'AGREEMENT',
  'RESOLUTION',
  'ANNEX',
  'LETTER',
] as const;

export const DOCUMENT_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SIGNED',
  'IN_PROGRESS',
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  CONTRACT: 'Umowa',
  AGREEMENT: 'Porozumienie',
  RESOLUTION: 'Uchwała',
  ANNEX: 'Aneks',
  LETTER: 'Pismo',
};
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Roboczy',
  PENDING_APPROVAL: 'Do akceptacji',
  APPROVED: 'Zatwierdzony',
  SIGNED: 'Podpisany',
  IN_PROGRESS: 'W toku',
};

export const DOCUMENT_STATUS_CLASSES: Record<DocumentStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-lightGreen text-darkGreen',
  SIGNED: 'bg-darkGreen text-white',
  IN_PROGRESS: 'bg-gray-100 text-gray-600',
};
export const DOCUMENT_KINDS_OPTIONS: ReadonlyArray<{
  value: string;
  label: string;
}> = DOCUMENT_KINDS.map((k) => ({ value: k, label: DOCUMENT_KIND_LABELS[k] }));