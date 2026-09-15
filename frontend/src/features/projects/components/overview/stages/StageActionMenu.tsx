import { HiOutlinePencil } from 'react-icons/hi';
import { FiArchive, FiCalendar, FiTrash2 } from 'react-icons/fi';
import {
  ActionMenu,
  type ActionMenuItem,
} from '../../../../../components/ui/ActionMenu';
import type { Stage } from '../../../types';
import type { StageView } from '../../../utils/stageState';

interface StageActionMenuProps {
  stage: Stage;
  view: StageView;
  onEdit: () => void;
  onMoveDeadline: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function StageActionMenu({
  stage,
  view,
  onEdit,
  onMoveDeadline,
  onArchive,
  onDelete,
}: StageActionMenuProps) {
  const isCompleted = view.status === 'completed';

  const items: ActionMenuItem[] = [
    {
      id: 'edit',
      label: 'Edytuj',
      icon: <HiOutlinePencil className="h-3.5 w-3.5" aria-hidden="true" />,
      onSelect: onEdit,
    },
  ];

  if (!isCompleted) {
    items.push({
      id: 'move-deadline',
      label: 'Przenieś termin',
      icon: <FiCalendar className="h-3.5 w-3.5" aria-hidden="true" />,
      onSelect: onMoveDeadline,
    });
  }

  items.push({
    id: 'archive',
    label: 'Archiwizuj',
    icon: <FiArchive className="h-3.5 w-3.5" aria-hidden="true" />,
    onSelect: onArchive,
  });

  if (!isCompleted) {
    items.push({
      id: 'delete',
      label: 'Usuń',
      tone: 'danger',
      icon: <FiTrash2 className="h-3.5 w-3.5" aria-hidden="true" />,
      onSelect: onDelete,
    });
  }

  return (
    <ActionMenu
      ariaLabel={`Akcje etapu ${stage.name}`}
      className="-mr-1 shrink-0"
      items={items}
    />
  );
}
