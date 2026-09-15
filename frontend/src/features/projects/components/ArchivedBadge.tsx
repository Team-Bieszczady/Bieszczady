import { getStatusColor } from '../overviewStatuses';

export default function ArchivedBadge() {
  return (
    <span
      className={`inline-flex h-8 shrink-0 items-center rounded-lg px-3.5 text-xs font-semibold whitespace-nowrap ${getStatusColor('gray').pill}`}
      title="Projekt jest w Archiwum i jest tylko do odczytu"
    >
      Zarchiwizowany
    </span>
  );
}
