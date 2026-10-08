import type { Partner } from '../data';
import ProjectChips from '../../people/components/ProjectChips';
import PartnerActions from './PartnerActions';
import PartnerAgreement from './PartnerAgreement';
import PartnerStatusPill from './PartnerStatusPill';
import { Avatar } from '../../../components/ui/Avatar';

interface PartnerCardProps {
  partner: Partner;
  onOpen: (partner: Partner) => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

export default function PartnerCard({
  partner,
  onOpen,
  onEdit,
  onDelete,
}: PartnerCardProps) {
  return (
    <div
      onClick={() => onOpen(partner)}
      className="border border-gray-200 rounded-lg bg-white p-4 transition-colors cursor-pointer hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar initials={partner.initials} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-dark">{partner.name}</p>
            <p className="text-xs text-gray-500 truncate">{partner.type}</p>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <PartnerActions
            partner={partner}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 mb-3" />

      <div className="space-y-3 text-xs">
        <div className="grid grid-cols-2">
          <div className="min-w-0">
            <p className="text-gray-500">Osoba kontaktowa</p>
            <p className="text-dark font-medium">{partner.contactName}</p>
            <p className="text-gray-500 truncate">{partner.contactEmail}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Status</p>
            <PartnerStatusPill status={partner.status} size="sm" />
          </div>
        </div>

        <div>
          <p className="text-gray-500">Projekty</p>
          <ProjectChips projects={partner.projects} chipClassName="rounded" />
        </div>

        <div>
          <p className="text-gray-500">Umowa</p>
          <PartnerAgreement partner={partner} />
        </div>
      </div>
    </div>
  );
}
