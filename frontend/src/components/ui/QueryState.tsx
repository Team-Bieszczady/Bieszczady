import type { ReactNode } from 'react';
import { PageMessage } from './PageMessage';
import { Spinner } from './Spinner';
import { isApiError } from '../../lib/api';

function defaultResolveError(error: Error | null, fallback: string): string {
  if (!isApiError(error)) return fallback;
  return error.message || fallback;
}

interface QueryStateProps<T> {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: T | undefined;
  errorMessage: string;
  notFoundMessage: string;
  terminalStatuses?: number[];
  resolveError?: (error: Error | null, fallback: string) => string;
  refetch: () => void;
  children: (data: T) => ReactNode;
}

export function QueryState<T>({
  isLoading,
  isError,
  error,
  data,
  errorMessage,
  notFoundMessage,
  terminalStatuses = [404],
  resolveError = defaultResolveError,
  refetch,
  children,
}: QueryStateProps<T>) {
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
    const isTerminal =
      status !== undefined && terminalStatuses.includes(status);

    return (
      <PageMessage
        message={resolveError(error, errorMessage)}
        onRetry={isTerminal ? undefined : refetch}
      />
    );
  }

  if (!data) {
    return <PageMessage message={notFoundMessage} />;
  }

  return <>{children(data)}</>;
}
