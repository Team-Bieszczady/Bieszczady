import { useId, useRef, type ReactNode } from 'react';
import { IoCloseOutline } from 'react-icons/io5';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useOnClickOutside([contentRef], onClose, isOpen);
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-pop-in"
      >

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 id={titleId} className="text-xl font-semibold text-dark">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-dark transition-colors"
            type="button"
            aria-label="Close modal"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 modal-scrollbar">{children}</div>
      </div>
    </div>
  );
}
