import type { SelectOption } from '../../components/ui/Select';
import type { PartnerStatus } from './data';

export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  ACTIVE: 'Aktywny',
  PAUSED: 'Zatrzymany',
};

export const PARTNER_STATUS_TONE: Record<PartnerStatus, string> = {
  ACTIVE: 'bg-lightGreen text-darkGreen',
  PAUSED: 'bg-gray-200 text-gray-600',
};

export const PARTNER_STATUS_OPTIONS: SelectOption[] = [
  { value: 'ACTIVE', label: PARTNER_STATUS_LABELS.ACTIVE },
  { value: 'PAUSED', label: PARTNER_STATUS_LABELS.PAUSED },
];

export const PARTNER_TYPE_OPTIONS: SelectOption[] = [
  'Fundacja',
  'Stowarzyszenie',
  'Samorząd',
  'Instytucja publiczna',
  'Instytucja kultury',
  'Firma',
].map((type) => ({ value: type, label: type }));

export const NO_AGREEMENT = 'Brak umowy';

export const AGREEMENT_OPTIONS: SelectOption[] = [
  'Umowa partnerska',
  'Porozumienie',
  'List intencyjny',
  NO_AGREEMENT,
].map((agreement) => ({ value: agreement, label: agreement }));
