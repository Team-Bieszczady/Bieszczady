import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuthToken } from '../../../context/useAuthToken';
import { useApiMutation } from '../../../hooks/useApiMutation';
import { eventsApi, type BackendEventPage } from '../../../lib/eventsApi';

export const eventKeys = {
  all: ['events'] as const,
  list: (projectId: string, from: string) =>
    ['events', { projectId, from }] as const,
};

/** Cursor-paginated, so this is the one query in the app that cannot go
 * through `useApiQuery` — it wraps `useQuery`, not `useInfiniteQuery`. */
export function useEvents(projectId: string, from: string) {
  const { hasToken, requireToken } = useAuthToken();

  return useInfiniteQuery({
    queryKey: eventKeys.list(projectId, from),
    queryFn: ({ pageParam }) =>
      eventsApi.list(requireToken(), {
        projectId,
        from,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: BackendEventPage) =>
      lastPage.nextCursor ?? undefined,
    enabled: hasToken,
  });
}

export function useCreateEvent() {
  return useApiMutation(
    (token, body: { projectId: string; content: string }) =>
      eventsApi.create(token, body),
    // The prefix, so every filter combination refetches after a write.
    { invalidates: [eventKeys.all] },
  );
}
