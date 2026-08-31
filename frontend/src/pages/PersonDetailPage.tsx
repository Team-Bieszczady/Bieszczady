import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import { SlTrash } from 'react-icons/sl';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import AccountPageShell from '../features/people/components/AccountPageShell';
import AccountQueryState from '../features/people/components/AccountQueryState';
import AccountProfileHeader from '../features/people/components/AccountProfileHeader';
import AccountProfileCard from '../features/people/components/AccountProfileCard';
import DeleteAccountDialog from '../features/people/components/DeleteAccountDialog';
import { usePerson } from '../features/people/hooks/usePerson';
import { useSetAccountStatus } from '../features/people/hooks/useSetAccountStatus';
import { toastAccountError } from '../features/people/utils/accountErrorMessage';
import { useAuth } from '../context/useAuth';
import type { AccountStatus } from '../lib/api';
import type { Person } from '../features/people/data';

type PendingAction = 'deactivate' | 'activate' | 'delete' | null;

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: person, isLoading, isError, error, refetch } = usePerson(id);

  return (
    <AccountQueryState
      isLoading={isLoading}
      isError={isError}
      error={error}
      person={person}
      errorMessage="Nie udało się pobrać danych osoby."
      notFoundMessage="Osoba nie znaleziona"
      terminalStatuses={[403, 404]}
      refetch={() => void refetch()}
    >
      {(loadedPerson) => <PersonDetail person={loadedPerson} />}
    </AccountQueryState>
  );
}

function PersonDetail({ person }: { person: Person }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const setAccountStatus = useSetAccountStatus();
  const [pending, setPending] = useState<PendingAction>(null);

  const projectsWithRole = person.projects.map((project) => ({
    ...project,
    role: person.role,
  }));

  const isActive = person.accountStatus === 'ACTIVE';
  const fullName = `${person.firstName} ${person.lastName}`;

  const changeStatus = (accountStatus: AccountStatus) => {
    setAccountStatus.mutate(
      { id: person.id, accountStatus },
      {
        onSuccess: () => {
          toast.success(
            accountStatus === 'ACTIVE'
              ? 'Konto zostało aktywowane.'
              : 'Konto zostało dezaktywowane.',
          );
          setPending(null);
        },
        onError: toastAccountError,
      },
    );
  };

  const actions = user?.isDirector ? (
    <>
      {isActive ? (
        <Button
          variant="outline"
          size="compact"
          className="text-darkRed border-darkRed hover:border-darkRed hover:bg-red-50"
          onClick={() => setPending('deactivate')}
        >
          Dezaktywuj konto
        </Button>
      ) : (
        <Button
          variant="outline"
          size="compact"
          onClick={() => setPending('activate')}
        >
          Aktywuj konto
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Usuń konto"
        className="text-darkRed hover:bg-red-50"
        onClick={() => setPending('delete')}
      >
        <SlTrash className="h-4 w-4" aria-hidden="true" />
      </Button>
    </>
  ) : undefined;

  return (
    <AccountPageShell>
      <AccountProfileHeader
        name={fullName}
        subtitle={person.isDirector ? 'Dyrektor' : 'Użytkownik'}
        initials={person.initials}
        avatar={person.avatar}
        actions={actions}
      />

      <AccountProfileCard
        email={person.email}
        phone={person.phone}
        projects={projectsWithRole}
        tasksCount={person.tasksCount}
        lastLoginAt={person.lastLoginAt}
        createdAt={person.createdAt}
        status={person.status}
      />

      <ConfirmDialog
        isOpen={pending === 'deactivate'}
        onClose={() => setPending(null)}
        onConfirm={() => changeStatus('INACTIVE')}
        title="Dezaktywować konto?"
        description={`${fullName} nie będzie mógł się zalogować. Konto i dane pozostaną w systemie.`}
        confirmLabel="Dezaktywuj konto"
        tone="danger"
        isPending={setAccountStatus.isPending}
      />

      <ConfirmDialog
        isOpen={pending === 'activate'}
        onClose={() => setPending(null)}
        onConfirm={() => changeStatus('ACTIVE')}
        title="Aktywować konto?"
        description={`${fullName} odzyska możliwość logowania.`}
        confirmLabel="Aktywuj konto"
        isPending={setAccountStatus.isPending}
      />

      <DeleteAccountDialog
        person={person}
        isOpen={pending === 'delete'}
        onClose={() => setPending(null)}
        onDeleted={() => navigate('/people', { replace: true })}
      />
    </AccountPageShell>
  );
}
