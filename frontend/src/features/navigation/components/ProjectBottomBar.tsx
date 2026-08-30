import { NavLink } from 'react-router';
import type { NavItem } from '../data';

interface ProjectBottomBarProps {
  items: NavItem[];
}

export default function ProjectBottomBar({ items }: ProjectBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 mx-8 bg-white flex gap-2 md:justify-center md:gap-x-18 lg:hidden z-30">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `relative flex-1 md:flex-none flex flex-col items-center py-3 text-xs md:text-sm transition-colors ${
              isActive
                ? 'text-darkGreen font-medium'
                : 'text-dark/70 hover:text-dark'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 border-t-2 border-darkGreen" />
              )}
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}
