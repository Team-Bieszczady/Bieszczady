import { Link } from 'react-router';
import { Avatar } from '../../../components/ui/Avatar';

interface UserFooterProps {
  initials: string;
  name: string;
  avatarSrc?: string | null;
  isDirector?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export default function UserFooter({
  initials,
  name,
  avatarSrc,
  isDirector = false,
  onNavigate,
  className = '',
}: UserFooterProps) {
  return (
    <div className={`flex items-center w-full px-4 py-2 border-t border-gray-200 ${className}`}>
      <Link
        to="/profile"
        onClick={onNavigate}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-70 transition-opacity"
      >
        <Avatar initials={initials} src={avatarSrc} size="xs" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-dark text-xs truncate">{name}</p>
          {isDirector && <p className="text-[10px] text-gray-400">Dyrektor</p>}
        </div>
        <svg
          className="w-3 h-3 text-gray-400 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  );
}
