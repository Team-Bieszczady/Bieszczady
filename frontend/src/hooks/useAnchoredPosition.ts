import { useEffect, useState, type RefObject } from 'react';

export interface AnchoredPosition {
  top: number;
  bottom: number;
  right: number;
  left: number;
  width: number;
  placement: 'bottom' | 'top';
  maxHeight: number;
}

export interface AnchoredPositionOptions {
  offset?: number;
  viewportMargin?: number;
  flip?: boolean;
  preferredHeight?: number;
}

export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  {
    offset = 4,
    viewportMargin = 8,
    flip = false,
    preferredHeight = 240,
  }: AnchoredPositionOptions = {},
): AnchoredPosition {
  const [position, setPosition] = useState<AnchoredPosition>({
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: 0,
    placement: 'bottom',
    maxHeight: preferredHeight,
  });

  useEffect(() => {
    if (!enabled) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - offset - viewportMargin;
      const spaceAbove = rect.top - offset - viewportMargin;
      const openUpward = flip && spaceBelow < preferredHeight && spaceAbove > spaceBelow;

      setPosition({
        top: rect.bottom + offset,
        bottom: window.innerHeight - rect.top + offset,
        right: Math.max(viewportMargin, window.innerWidth - rect.right),
        left: Math.max(viewportMargin, rect.left),
        width: rect.width,
        placement: openUpward ? 'top' : 'bottom',
        maxHeight: Math.max(120, openUpward ? spaceAbove : spaceBelow),
      });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);

    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, enabled, offset, viewportMargin, flip, preferredHeight]);

  return position;
}
