import type { ReactNode } from 'react';
import { PiDotsThreeOutlineFill } from 'react-icons/pi';
import { useAnchoredPopup } from '../../hooks/useAnchoredPopup';
import { PopoverPanel } from './PopoverPanel';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  tone?: 'default' | 'danger';
  onSelect: () => void;
}

interface ActionMenuProps {
  items: ReadonlyArray<ActionMenuItem>;
  ariaLabel: string;
  className?: string;
}

const ITEM_TONE = {
  default: 'text-dark',
  danger: 'text-darkRed',
} as const;

export function ActionMenu({
  items,
  ariaLabel,
  className = '',
}: ActionMenuProps) {
  const { isOpen, close, toggle, buttonRef, panelRef, position } =
    useAnchoredPopup<HTMLButtonElement, HTMLDivElement>({
      offset: 4,
      viewportMargin: 8,
      flip: true,
      restoreFocus: true,
    });

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`cursor-pointer rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen ${className}`}
      >
        <PiDotsThreeOutlineFill className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <PopoverPanel
          panelRef={panelRef}
          position={position}
          align="right"
          minWidth={180}
          role="menu"
          ariaLabel={ariaLabel}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-xs whitespace-nowrap transition-colors hover:bg-gray-50 ${
                ITEM_TONE[item.tone ?? 'default']
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </PopoverPanel>
      )}
    </>
  );
}
