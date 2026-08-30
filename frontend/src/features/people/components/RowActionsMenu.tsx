import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { PiDotsThreeOutlineFill } from 'react-icons/pi';
import { IoEyeOutline } from 'react-icons/io5';
import { useAnchoredPopup } from '../../../hooks/useAnchoredPopup';

export interface RowActionsMenuProps {
  personId: string;
  canDelete?: boolean;
  onDelete?: () => void;
}

export default function RowActionsMenu({
  personId,
  canDelete = false,
  onDelete,
}: RowActionsMenuProps) {
  const navigate = useNavigate();
  const {
    isOpen,
    close,
    toggle,
    buttonRef,
    panelRef: menuRef,
    position,
  } = useAnchoredPopup<HTMLButtonElement, HTMLDivElement>({
    offset: -12,
    viewportMargin: 8,
  });

  const itemClass =
    'flex items-center gap-1.5 px-4 py-2 text-xs whitespace-nowrap transition-colors hover:opacity-70 cursor-pointer';

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        className="p-1 text-gray-400 hover:text-dark transition-colors cursor-pointer"
        type="button"
        aria-label="Akcje wiersza"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <PiDotsThreeOutlineFill className="w-5 h-5" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="fixed z-40 w-max rounded-xl border border-gray-200 bg-white shadow-lg"
            style={{ top: `${position.top}px`, right: `${position.right}px` }}
          >
            <div className="flex items-center divide-x divide-gray-200">
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  close();
                  navigate(`/people/${personId}`);
                }}
                className={`${itemClass} text-gray-700`}
              >
                <IoEyeOutline className="h-3.5 w-3.5" aria-hidden="true" />
                Zobacz więcej
              </button>

              {canDelete && onDelete && (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    close();
                    onDelete();
                  }}
                  className={`${itemClass} text-darkRed`}
                >
                  Usuń
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
