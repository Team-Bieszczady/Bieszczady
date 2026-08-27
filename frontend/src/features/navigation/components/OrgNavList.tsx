import { NavLink } from 'react-router';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface OrgNavListProps {
  items: NavItem[];
  className?: string;
  useDesktopStyle?: boolean;
  onNavigate?: () => void;
}

export default function OrgNavList({
  items,
  className = '',
  useDesktopStyle = false,
  onNavigate,
}: OrgNavListProps) {
  return (
    <div
      className={`flex flex-col gap-2 lg:gap-1 px-4 ${useDesktopStyle ? 'border-l border-gray' : ''} ${className}`}
    >
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `text-left transition-all ${
              useDesktopStyle
                ? isActive
                  ? 'px-2.5 py-1.5 text-darkGreen bg-lightGreen border-l-2 border-darkGreen'
                  : 'px-2.5 py-1.5 text-dark border-l-2 border-transparent hover:border-dark/60'
                : isActive
                  ? 'px-3 py-2 text-sm font-medium text-darkGreen bg-green-100 border-l-4 border-darkGreen'
                  : 'px-3 py-2 text-sm text-dark'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
