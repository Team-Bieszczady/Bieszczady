import { HiOutlinePencil } from 'react-icons/hi';
import { FiTrash2 } from 'react-icons/fi';
import { ActionMenu } from '../../../components/ui/ActionMenu';
import type { Partner } from '../data';

interface PartnerActionsProps {
  partner: Partner;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
}

export default function PartnerActions({
  partner,
  onEdit,
  onDelete,
}: PartnerActionsProps) {
  return (
    <ActionMenu
      ariaLabel={`Akcje partnera ${partner.name}`}
      items={[
        {
          id: 'edit',
          label: 'Edytuj',
          icon: <HiOutlinePencil className="h-4 w-4" aria-hidden="true" />,
          onSelect: () => onEdit(partner),
        },
        {
          id: 'delete',
          label: 'Usuń',
          tone: 'danger',
          icon: <FiTrash2 className="h-4 w-4" aria-hidden="true" />,
          onSelect: () => onDelete(partner),
        },
      ]}
    />
  );
}
