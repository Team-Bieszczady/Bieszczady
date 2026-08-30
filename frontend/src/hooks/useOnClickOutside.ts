import { useEffect, useRef, type RefObject } from 'react';

export function useOnClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  handler: () => void,
  enabled = true,
): void {
  const handlerRef = useRef(handler);
  const refsRef = useRef(refs);

  useEffect(() => {
    handlerRef.current = handler;
    refsRef.current = refs;
  });

  useEffect(() => {
    if (!enabled) return;

    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInside = refsRef.current.some((ref) =>
        ref.current?.contains(target),
      );
      if (!isInside) handlerRef.current();
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [enabled]);
}
