export const DOCUMENT_KINDS = [
  'CONTRACT',
  'AGREEMENT',
  'RESOLUTION',
  'ANNEX',
  'LETTER',
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  CONTRACT: 'Umowa',
  AGREEMENT: 'Porozumienie',
  RESOLUTION: 'Uchwała',
  ANNEX: 'Aneks',
  LETTER: 'Pismo',
};
