import { useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { Button } from '../components/ui/Button';
import AccountPageShell from '../features/people/components/AccountPageShell';
import AccountQueryState from '../features/people/components/AccountQueryState';
import AccountProfileHeader from '../features/people/components/AccountProfileHeader';
import AccountProfileCard from '../features/people/components/AccountProfileCard';
import EditAccountModal from '../features/people/components/EditAccountModal';
import LogoutConfirmDialog from '../features/auth/components/LogoutConfirmDialog';
import NotificationBell from '../features/notifications/components/NotificationBell';
import { useCurrentUser } from '../features/people/hooks/useCurrentUser';
import { useLogout } from '../features/auth/hooks/useLogout';

export default function ProfilePage() {
  const { data: person, isLoading, isError, error, refetch } = useCurrentUser();
  const logout = useLogout();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  return (
    <AccountQueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      person={person}
      errorMessage="Nie udało się pobrać danych konta."
      notFoundMessage="Nie znaleziono użytkownika"
      refetch={() => void refetch()}
    >
      {(person) => (
        <AccountPageShell>
          <AccountProfileHeader
            name={`${person.firstName} ${person.lastName}`}
            subtitle={person.isDirector ? 'Dyrektor' : 'Użytkownik'}
            initials={person.initials}
            avatar={person.avatar}
            actions={
              <>
                <NotificationBell />
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => setIsEditOpen(true)}
                >
                  Edytuj konto
                </Button>
                <Button
                  variant="outline"
                  size="compact"
                  onClick={() => setIsLogoutOpen(true)}
                >
                  <FiLogOut className="h-4 w-4" aria-hidden="true" />
                  Wyloguj się
                </Button>
              </>
            }
          />

          <AccountProfileCard
            email={person.email}
            phone={person.phone}
            projects={[]}
            tasksCount={person.tasksCount}
            lastLoginAt={person.lastLoginAt}
            createdAt={person.createdAt}
            status={person.status}
          />

          <EditAccountModal
            person={person}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />

          <LogoutConfirmDialog
            isOpen={isLogoutOpen}
            onClose={() => setIsLogoutOpen(false)}
            onConfirm={() => void logout()}
          />
        </AccountPageShell>
      )}
    </AccountQueryState>
  );
}
