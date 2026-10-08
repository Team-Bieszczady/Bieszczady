import type { Partner } from '../data';
import ProjectChips from '../../people/components/ProjectChips';
import PartnerActions from './PartnerActions';
import PartnerAgreement from './PartnerAgreement';
import PartnerStatusPill from './PartnerStatusPill';
import { Avatar } from '../../../components/ui/Avatar';

interface PartnersTableRowProps {
  partner: Partner;
  onOpen: (partner: Partner) => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

export default function PartnersTableRow({
  partner,
  onOpen,
  onEdit,
  onDelete,
}: PartnersTableRowProps) {
  return (
    <tr
      onClick={() => onOpen(partner)}
      className="border-b border-gray-200 transition-colors hover:bg-gray-50 cursor-pointer"
    >
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-3">
          <Avatar initials={partner.initials} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-dark">{partner.name}</p>
            <p className="text-xs text-gray-500">
              {partner.type} ·{' '}
              {partner.nip ? `NIP ${partner.nip}` : partner.city}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <p className="text-xs font-medium text-dark">{partner.contactName}</p>
        <p className="text-xs text-gray-500">{partner.contactEmail}</p>
      </td>

      <td className="px-4 py-3">
        <ProjectChips projects={partner.projects} chipClassName="rounded-md" />
      </td>

      <td className="px-4 py-3">
        <PartnerAgreement partner={partner} />
      </td>

      <td className="px-4 py-3">
        <PartnerStatusPill status={partner.status} />
      </td>

      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end">
          <PartnerActions
            partner={partner}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}
