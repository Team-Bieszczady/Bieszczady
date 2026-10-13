import { PARTNER_STATUS_LABELS, PARTNER_STATUS_TONE } from '../constants';
import type { PartnerStatus } from '../data';

interface PartnerStatusPillProps {
  status: PartnerStatus;
  size?: 'sm' | 'md';
}

export default function PartnerStatusPill({
  status,
  size = 'md',
}: PartnerStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full text-xs font-medium whitespace-nowrap ${
        size === 'sm' ? 'px-2 py-1' : 'px-3 py-1'
      } ${PARTNER_STATUS_TONE[status]}`}
    >
      {PARTNER_STATUS_LABELS[status]}
    </span>
  );
}
