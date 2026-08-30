import { useRef, useState, type RefObject } from 'react';
import {
  useAnchoredPosition,
  type AnchoredPosition,
  type AnchoredPositionOptions,
} from './useAnchoredPosition';
import { useOnClickOutside } from './useOnClickOutside';
import { useEscapeKey } from './useEscapeKey';

interface AnchoredPopupOptions extends AnchoredPositionOptions {
  restoreFocus?: boolean;
}

interface AnchoredPopup<TButton extends HTMLElement, TPanel extends HTMLElement> {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  buttonRef: RefObject<TButton | null>;
  panelRef: RefObject<TPanel | null>;
  position: AnchoredPosition;
}

export function useAnchoredPopup<
  TButton extends HTMLElement,
  TPanel extends HTMLElement,
>({ restoreFocus = false, ...positionOptions }: AnchoredPopupOptions = {}):
  AnchoredPopup<TButton, TPanel> {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<TButton>(null);
  const panelRef = useRef<TPanel>(null);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((wasOpen) => !wasOpen);

  const position = useAnchoredPosition(buttonRef, isOpen, positionOptions);

  useOnClickOutside([panelRef, buttonRef], close, isOpen);
  useEscapeKey(() => {
    close();
    if (restoreFocus) buttonRef.current?.focus();
  }, isOpen);

  return { isOpen, open, close, toggle, buttonRef, panelRef, position };
}
