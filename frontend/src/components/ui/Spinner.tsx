import { RotatingLines } from 'react-loader-spinner';

interface SpinnerProps {
  variant?: 'light' | 'dark';
  size?: string;
}

export function Spinner({ variant = 'dark', size = '20' }: SpinnerProps) {
  return (
    <RotatingLines
      visible
      width={size}
      strokeColor={variant === 'light' ? '#fff' : '#101010'}
      strokeWidth="5"
      animationDuration="0.75"
      ariaLabel="loading"
    />
  );
}
