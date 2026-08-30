import { NavLink } from 'react-router';
import type { NavItem } from '../data';

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
    <div className={`flex flex-col gap-2 lg:gap-1 ${useDesktopStyle ? 'relative' : 'px-4'} ${className}`}>
      {useDesktopStyle && <span className="absolute left-4 top-0 bottom-0 border-l border-dark/30" />}
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex items-center justify-between gap-2 py-1.5 transition-colors duration-200 ease-out ${
              useDesktopStyle
                ? isActive
                  ? 'ml-4 mr-4 text-xs font-medium text-darkGreen bg-lightGreen'
                  : 'ml-4 mr-4 text-xs text-gray-500 hover:text-dark hover:bg-gray-50'
                : isActive
                  ? 'px-3 py-2 text-xs font-medium text-darkGreen bg-lightGreen border-l-2 border-darkGreen'
                  : 'px-3 py-2 text-xs text-dark/70 border-l-2 border-transparent hover:text-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {useDesktopStyle && (
                <span
                  className={`absolute left-0 top-0 bottom-0 border-l-2 transition-colors duration-200 ease-out ${
                    isActive ? 'border-darkGreen' : 'border-transparent group-hover:border-dark/60'
                  }`}
                />
              )}
              <span className={useDesktopStyle ? 'pl-4' : ''}>{item.label}</span>
              {item.count !== undefined && (
                <span className={useDesktopStyle ? 'pr-3' : ''}>
                  <span
                    className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium transition-colors duration-200 ease-out ${
                      isActive
                        ? 'text-darkGreen'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.count}
                  </span>
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
