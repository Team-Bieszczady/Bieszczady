import type { ReactNode } from 'react';

interface InlineQueryStateProps<T> {
  isLoading: boolean;
  isError: boolean;
  isFetching?: boolean;
  data: T | undefined;
  errorMessage: string;
  loadingMessage?: string;
  onRetry: () => void;
  compact?: boolean;
  children: (data: T) => ReactNode;
}

export function InlineQueryState<T>({
  isLoading,
  isError,
  isFetching = false,
  data,
  errorMessage,
  loadingMessage = 'Ładowanie...',
  onRetry,
  compact = false,
  children,
}: InlineQueryStateProps<T>) {
  const retry = (
    <button
      type="button"
      onClick={onRetry}
      disabled={isFetching}
      className="cursor-pointer text-xs font-medium text-darkGreen hover:text-darkGreenHover disabled:cursor-default disabled:text-gray-400"
    >
      {isFetching ? 'Ponawianie...' : 'Spróbuj ponownie'}
    </button>
  );

  if (data !== undefined) {
    return (
      <>
        {isError && (
          <div
            role="alert"
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${
              compact
                ? 'mb-3'
                : 'justify-center border-b border-gray-200 px-4 py-2'
            }`}
          >
            <p className="text-xs text-darkRed">
              Nie udało się odświeżyć. Widoczne są ostatnio wczytane dane.
            </p>
            {retry}
          </div>
        )}
        {children(data)}
      </>
    );
  }

  if (isError) {
    return (
      <div role="alert" className={compact ? '' : 'px-4 py-10 text-center'}>
        <p className="mb-2 text-xs text-darkRed">{errorMessage}</p>
        {retry}
      </div>
    );
  }

  if (isLoading) {
    return (
      <p
        role="status"
        className={`${compact ? '' : 'px-4 py-10 text-center'} text-xs text-gray-400`}
      >
        {loadingMessage}
      </p>
    );
  }

  return null;
}
