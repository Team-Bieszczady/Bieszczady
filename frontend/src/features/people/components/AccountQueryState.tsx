import type { ReactNode } from 'react';
import { QueryState } from '../../../components/ui/QueryState';
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
  person,
  children,
  ...rest
}: AccountQueryStateProps) {
  return (
    <QueryState<Person>
      {...rest}
      data={person}
      resolveError={accountErrorMessage}
    >
      {children}
    </QueryState>
  );
}
