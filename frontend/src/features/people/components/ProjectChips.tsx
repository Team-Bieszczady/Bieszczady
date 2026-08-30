import { truncateText } from '../utils/truncate';
import type { Person } from '../data';

interface ProjectChipsProps {
  projects: Person['projects'];
  chipClassName?: string;
}

export default function ProjectChips({
  projects,
  chipClassName = 'rounded-full',
}: ProjectChipsProps) {
  const [first, ...rest] = projects;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {first && (
        <span
          className={`bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 whitespace-nowrap ${chipClassName}`}
        >
          {truncateText(first.name)}
        </span>
      )}
      {rest.length > 0 && (
        <span className="text-darkGreen text-xs font-semibold">
          +{rest.length}
        </span>
      )}
    </div>
  );
}
