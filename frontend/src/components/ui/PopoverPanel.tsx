import { useEffect, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { AnchoredPosition } from '../../hooks/useAnchoredPosition';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const PANEL_BASE =
  'nav-scrollbar animate-pop-in overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg';

interface PopoverPanelProps {
  panelRef: RefObject<HTMLDivElement | null>;
  position: AnchoredPosition;
  align?: 'left' | 'right';
  minWidth?: number;
  width?: number;
  centerOnMobile?: boolean;
  role?: 'listbox' | 'menu' | 'dialog';
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

export function PopoverPanel({
  panelRef,
  position,
  align = 'left',
  minWidth,
  width,
  centerOnMobile = false,
  role,
  ariaLabel,
  className = '',
  children,
}: PopoverPanelProps) {
  const isDesktop = useMediaQuery('(min-width: 800px)');
  const isCentered = centerOnMobile && !isDesktop;

  useEffect(() => {
    if (!isCentered) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCentered]);

  if (isCentered) {
    return createPortal(
      <div className="animate-fade-in fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
        <div
          ref={panelRef}
          role={role}
          aria-label={ariaLabel}
          onMouseDown={(event) => event.stopPropagation()}
          className={`${PANEL_BASE} max-h-[70vh] w-full max-w-sm ${className}`}
        >
          {children}
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div
      ref={panelRef}
      role={role}
      aria-label={ariaLabel}
      onMouseDown={(event) => event.stopPropagation()}
      style={{
        ...(align === 'left'
          ? { left: position.left }
          : { right: position.right }),
        ...(position.placement === 'bottom'
          ? { top: position.top }
          : { bottom: position.bottom }),
        minWidth: minWidth ?? position.width,
        width,
        maxHeight: position.maxHeight,
      }}
      className={`${PANEL_BASE} fixed z-60 ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
