import type { RadioPillOption } from '../../components/ui/RadioPillGroup';
import type { HistoryKind, InvoiceStatus, VersionStatus } from './types';

export const COLUMN_TYPE_OPTIONS: RadioPillOption[] = [
  { value: 'text', label: 'Tekst' },
  { value: 'money', label: 'Kwota' },
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  TO_BE_PAID: 'Do wypłaty',
  PAID: 'Zapłacono',
};

export const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  TO_BE_PAID: 'bg-amberSoft text-amberDark',
  PAID: 'bg-lightGreen text-darkGreen',
};

export const VERSION_STATUS_LABELS: Record<VersionStatus, string> = {
  DRAFT: 'Roboczy',
  PENDING: 'Do rozpatrzenia',
  APPROVED: 'Zatwierdzony',
};

export const VERSION_STATUS_CLASSES: Record<VersionStatus, string> = {
  DRAFT: 'bg-gray-200 text-gray-600',
  PENDING: 'bg-amberSoft text-amberDark',
  APPROVED: 'bg-lightGreen text-darkGreen',
};

export const HISTORY_KIND_LABELS: Record<HistoryKind, string> = {
  CREATED: 'utworzono',
  EDITED: 'edytowano plan',
  SUBMITTED: 'wysłano do akceptacji',
  WITHDRAWN: 'wycofano prośbę o akceptację',
  APPROVED: 'zatwierdzono',
  REJECTED: 'odrzucono',
  REVERTED: 'cofnięto zatwierdzenie',
  DISCARDED: 'odrzucono wersję roboczą',
  METADATA_EDITED: 'zmieniono opis',
};
