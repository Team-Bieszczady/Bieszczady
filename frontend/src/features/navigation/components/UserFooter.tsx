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
      className={`flex items-center justify-between px-4 py-4 lg:py-3 border-t border-gray hover:bg-gray transition-colors ${className}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-darkGreen flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
        <p className="font-medium text-dark text-sm">{name}</p>
      </div>
      <svg
        className="w-5 h-5 text-gray"
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
