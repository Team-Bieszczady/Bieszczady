import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size?: 'md' | 'lg';
  header?: ReactNode;
  children: ReactNode;
}

const SIZE: Record<'md' | 'lg', string> = {
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  header,
  children,
}: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useOnClickOutside([contentRef], onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={header ? undefined : titleId}
        aria-label={header ? title : undefined}
        className={`bg-white rounded-lg ${SIZE[size]} w-full max-h-[90vh] overflow-hidden flex flex-col animate-pop-in`}
      >
        <div
          className={`flex justify-between gap-4 px-6 py-4 shrink-0 ${
            header ? 'items-start' : 'items-center border-b border-gray-200'
          }`}
        >
          {header ?? (
            <h2 id={titleId} className="text-xl font-semibold text-dark">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="p-1 shrink-0 text-gray-400 hover:text-dark transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 modal-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
