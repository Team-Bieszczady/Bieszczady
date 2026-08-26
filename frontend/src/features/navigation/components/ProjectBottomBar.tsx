import { NavLink } from 'react-router';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface ProjectBottomBarProps {
  items: NavItem[];
}

export default function ProjectBottomBar({ items }: ProjectBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray flex lg:hidden z-30">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 py-3 text-sm font-medium transition-colors border-t-2 ${
              isActive
                ? 'text-darkGreen border-t-darkGreen'
                : 'text-dark border-t-transparent'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
