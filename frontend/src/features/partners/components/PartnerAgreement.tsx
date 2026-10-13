import { formatNumericDate } from '../../projects/utils/isoDate';
import { NO_AGREEMENT } from '../constants';
import type { Partner } from '../data';

interface PartnerAgreementProps {
  partner: Partner;
}

export default function PartnerAgreement({ partner }: PartnerAgreementProps) {
  const isMissing = partner.agreement === NO_AGREEMENT;

  return (
    <div className="text-xs">
      <p className={isMissing ? 'text-amber-700' : 'text-gray-800'}>
        {partner.agreement}
      </p>
      <p className="text-gray-500">
        {isMissing
          ? 'do ustalenia'
          : partner.agreementValidUntil
            ? `do ${formatNumericDate(partner.agreementValidUntil)}`
            : 'bezterminowe'}
      </p>
    </div>
  );
}
