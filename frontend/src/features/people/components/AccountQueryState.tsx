import type { ReactNode } from 'react';
import { PageMessage } from '../../../components/ui/PageMessage';
import { Spinner } from '../../../components/ui/Spinner';
import { isApiError } from '../../../lib/api';
import { accountErrorMessage } from '../utils/accountErrorMessage';
import type { Person } from '../data';

interface AccountQueryStateProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  person: Person | undefined;
  errorMessage: string;
  notFoundMessage: string;
  terminalStatuses?: number[];
  refetch: () => void;
  children: (person: Person) => ReactNode;
}

export default function AccountQueryState({
  isLoading,
  isError,
  error,
  person,
  errorMessage,
  notFoundMessage,
  terminalStatuses = [404],
  refetch,
  children,
}: AccountQueryStateProps) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-3 h-screen px-6 text-center"
      >
        <Spinner variant="dark" size="32" />
        <p className="text-gray-500 text-sm">Ładowanie...</p>
      </div>
    );
  }

  if (isError) {
    const status = isApiError(error) ? error.status : undefined;
    const isTerminal = status !== undefined && terminalStatuses.includes(status);

    return (
      <PageMessage
        message={accountErrorMessage(error, errorMessage)}
        onRetry={isTerminal ? undefined : refetch}
      />
    );
  }

  if (!person) {
    return <PageMessage message={notFoundMessage} />;
  }

  return <>{children(person)}</>;
}
