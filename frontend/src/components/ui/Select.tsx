import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { cva } from 'class-variance-authority';
import { SlArrowDown } from 'react-icons/sl';
import { IoCheckmark } from 'react-icons/io5';
import { useAnchoredPopup } from '../../hooks/useAnchoredPopup';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder: string;
  size?: 'sm' | 'md';
  onBlur?: () => void;
  invalid?: boolean;
  className?: string;
}

const trigger = cva(
  'inline-flex items-center justify-between gap-2 cursor-pointer rounded-lg border text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darkGreen focus-visible:ring-offset-1',
  {
    variants: {
      size: {
        sm: 'h-7 pl-2 pr-2',
        md: 'h-8 w-full px-3',
      },
      tone: {
        empty: 'bg-white border-gray-300 text-dark/75 hover:bg-gray-50',
        chosen:
          'bg-darkGreen border-transparent text-white hover:bg-darkGreenHover',
      },
      invalid: {
        true: 'border-darkRed',
        false: '',
      },
    },
    defaultVariants: { size: 'sm', tone: 'empty', invalid: false },
  },
);

export function Select({
  value,
  onChange,
  options,
  placeholder,
  size = 'sm',
  onBlur,
  invalid = false,
  className = '',
}: SelectProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const rows: SelectOption[] = [{ value: '', label: placeholder }, ...options];
  const selected = options.find((option) => option.value === value);

  const {
    isOpen,
    open: openPanel,
    close,
    buttonRef,
    panelRef,
    position,
  } = useAnchoredPopup<HTMLButtonElement, HTMLDivElement>({
    offset: 4,
    viewportMargin: 8,
    flip: true,
    preferredHeight: 240,
    restoreFocus: true,
  });

  const open = () => {
    setActiveIndex(Math.max(0, rows.findIndex((row) => row.value === value)));
    openPanel();
  };

  const choose = (next: string) => {
    onChange(next);
    close();
    onBlur?.();
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex, panelRef]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        open();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((index) => Math.min(rows.length - 1, index + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(rows.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choose(rows[activeIndex].value);
        break;
      case 'Tab':
        close();
        break;
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={isOpen ? `${listId}-${activeIndex}` : undefined}
        aria-label={placeholder}
        aria-invalid={invalid || undefined}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onKeyDown}
        className={`${trigger({ size, tone: selected ? 'chosen' : 'empty', invalid })} ${className}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <SlArrowDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            id={listId}
            role="listbox"
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              left: position.left,
              minWidth: position.width,
              maxWidth: `min(20rem, calc(100vw - ${position.left}px - 8px))`,
              maxHeight: position.maxHeight,
              ...(position.placement === 'bottom'
                ? { top: position.top }
                : { bottom: position.bottom }),
            }}
            className={`fixed z-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg nav-scrollbar animate-pop-in ${
              position.placement === 'bottom' ? 'origin-top' : 'origin-bottom'
            }`}
          >
            {rows.map((row, index) => {
              const isSelected = row.value === value;

              return (
                <button
                  key={row.value || '__clear'}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-active={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(row.value)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md p-2 text-left text-xs transition-colors ${
                    isSelected ? 'font-medium text-darkGreen' : 'text-dark'
                  } ${index === activeIndex ? 'bg-gray-50' : ''}`}
                >
                  <span className="truncate">{row.label}</span>
                  {isSelected && (
                    <IoCheckmark className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
