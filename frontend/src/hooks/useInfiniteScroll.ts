import { useEffect, useRef, type RefObject } from 'react';

interface UseInfiniteScrollOptions {
  enabled: boolean;
  hasMore: boolean;
  loadedCount: number;
  onLoadMore: () => void;
  rootMargin?: string;
}

export function useInfiniteScroll<T extends HTMLElement>({
  enabled,
  hasMore,
  loadedCount,
  onLoadMore,
  rootMargin = '200px',
}: UseInfiniteScrollOptions): RefObject<T | null> {
  const sentinelRef = useRef<T>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!enabled || !hasMore || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onLoadMoreRef.current();
      },
      { rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, hasMore, loadedCount, rootMargin]);

  return sentinelRef;
}
