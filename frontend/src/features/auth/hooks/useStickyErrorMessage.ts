import { useRef } from 'react';

export function useStickyErrorMessage(message?: string) {
  const ref = useRef<string | undefined>(undefined);
  if (message) ref.current = message;
  return ref.current;
}
