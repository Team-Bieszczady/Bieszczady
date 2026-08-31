import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center cursor-pointer justify-center font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-darkGreen text-white hover:bg-darkGreenHover',
        secondary: 'border border-lightGreen text-dark hover:bg-slate-100',
        warning: 'bg-[#e7ffca] text-dark hover:bg-[#d9f5a8]',
        outline: 'bg-white border border-dark/30 text-dark hover:bg-gray-50',
        ghost: 'bg-transparent text-dark hover:bg-gray-100',
      },
      size: {
        small: 'h-8 px-6 py-1.5 text-sm',
        medium: 'h-10 px-4 text-base',
        large: 'h-12 px-6 text-lg',
        compact: 'h-11 gap-2 px-3 text-sm lg:h-9 lg:px-3.5',
        icon: 'h-11 w-11 p-0 lg:h-9 lg:w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isPending?: boolean;
}

export function Button({
  className,
  variant,
  size,
  isPending = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({
        variant,
        size,
        className: isPending ? `gap-2 ${className ?? ''}` : className,
      })}
      disabled={disabled || isPending}
      {...props}
    >
      {isPending && (
        <Spinner
          variant={variant == null || variant === 'primary' ? 'light' : 'dark'}
          size="16"
        />
      )}
      {children}
    </button>
  );
}
