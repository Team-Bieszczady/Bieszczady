import { Link } from 'react-router';

interface UserFooterProps {
  initials: string;
  name: string;
  className?: string;
}

export default function UserFooter({ initials, name, className = '' }: UserFooterProps) {
  return (
    <Link
      to="/profile"
      className={`flex items-center justify-between w-full px-4 py-3 border-t border-gray-200 hover:bg-gray-50 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-darkGreen flex items-center justify-center text-white text-xs font-bold lg:text-sm">
          {initials}
        </div>
        <p className="font-medium text-dark text-sm">{name}</p>
      </div>
      <svg
        className="w-4 h-4 text-gray-400 lg:w-5 lg:h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  );
}
