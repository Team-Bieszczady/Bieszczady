import { useAuth } from '../../../context/useAuth';
import { hasModule } from '../../../lib/modules';
import { usePeople } from '../../people/hooks/usePeople';
import { useCurrentUser } from '../../people/hooks/useCurrentUser';
import { ORG_NAV_ITEMS, PROJECT_NAV_ITEMS, type NavItem } from '../data';

interface NavData {
  initials: string;
  name: string;
  avatarSrc: string | null;
  isDirector: boolean;
  orgNavItems: NavItem[];
  projectNavItems: NavItem[];
}

export function useNavData(): NavData {
  const { user } = useAuth();
  const { data: people = [] } = usePeople({
    enabled: hasModule(user, 'PEOPLE'),
  });
  const { data: me } = useCurrentUser();

  const orgNavItems = ORG_NAV_ITEMS.filter((item) =>
    hasModule(user, item.module),
  ).map((item) =>
    item.id === 'people' ? { ...item, count: people.length } : item,
  );

  return {
    initials: user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '',
    name: user ? `${user.firstName} ${user.lastName}` : '',
    avatarSrc: me?.avatar ?? null,
    isDirector: user?.isDirector ?? false,
    orgNavItems,
    projectNavItems: PROJECT_NAV_ITEMS.filter((item) =>
      hasModule(user, item.module),
    ),
  };
}
