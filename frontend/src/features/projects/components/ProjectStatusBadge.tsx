import { getStatusColor } from '../overviewStatuses';

interface ProjectStatusBadgeProps {
  status: { name: string; color: string } | null;
  size?: 'sm' | 'md';
}

export default function ProjectStatusBadge({
  status,
  size = 'md',
}: ProjectStatusBadgeProps) {
  if (!status) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md font-semibold tracking-[0.4px] whitespace-nowrap ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1.25 text-[11px]'
      } ${getStatusColor(status.color).pill}`}
    >
      {status.name.toUpperCase()}
    </span>
  );
}
