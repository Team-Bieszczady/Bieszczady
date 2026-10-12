import { useEffect, useRef } from 'react';

export function useEscapeKey(
  handler: () => void,
  enabled = true,
  capture = false,
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (event.defaultPrevented) return;

      event.preventDefault();
      handlerRef.current();
    };

    document.addEventListener('keydown', onKeyDown, capture);
    return () => document.removeEventListener('keydown', onKeyDown, capture);
  }, [enabled, capture]);
}
