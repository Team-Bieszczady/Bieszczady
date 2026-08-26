import { NavLink } from 'react-router';

interface NavItem {
  id: string;
  label: string;
  path: string;
}

interface ProjectNavListProps {
  items: NavItem[];
}

export default function ProjectNavList({ items }: ProjectNavListProps) {
  return (
    <div className="flex flex-col gap-1 px-4 border-l border-gray">
      {items.map((item) => (
        <NavLink
          key={item.id}
          to={item.path}
          className={({ isActive }) =>
            `text-left px-2.5 py-1.5 transition-all ${
              isActive
                ? 'text-darkGreen bg-lightGreen border-l-2 border-darkGreen'
                : 'text-dark border-l-2 border-transparent hover:border-dark/60'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}
