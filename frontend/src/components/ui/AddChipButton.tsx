import { forwardRef } from 'react';
import { CHIP_BASE } from './Chip';

interface AddChipButtonProps {
  label?: string;
  onClick?: () => void;
  isExpanded?: boolean;
  className?: string;
}

export const AddChipButton = forwardRef<HTMLButtonElement, AddChipButtonProps>(
  function AddChipButton(
    { label = '+ dodaj', onClick, isExpanded, className = '' },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-haspopup={isExpanded === undefined ? undefined : 'dialog'}
        aria-expanded={isExpanded}
        className={`${CHIP_BASE} cursor-pointer border border-dashed border-gray-300 text-grayText transition-colors hover:border-darkGreen hover:text-darkGreen focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-darkGreen ${className}`}
      >
        {label}
      </button>
    );
  },
);
