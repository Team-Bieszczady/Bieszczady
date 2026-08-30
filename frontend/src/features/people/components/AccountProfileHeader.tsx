import type { ReactNode } from 'react';
import { Avatar } from '../../../components/ui/Avatar';

interface AccountProfileHeaderProps {
  name: string;
  subtitle: string;
  initials: string;
  avatar: string | null;
  actions?: ReactNode;
}

export default function AccountProfileHeader({
  name,
  subtitle,
  initials,
  avatar,
  actions,
}: AccountProfileHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 sm:flex-nowrap sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar initials={initials} src={avatar} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold text-dark lg:text-xl">
            {name}
          </h1>
          <p className="truncate text-xs text-gray-500 lg:text-sm">
            {subtitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
