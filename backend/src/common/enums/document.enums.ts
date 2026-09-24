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
 export const ACCESS_LEVELS = ['VIEW', 'EDIT'] as const;
 
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
 export type AccessLevel = (typeof ACCESS_LEVELS)[number];
