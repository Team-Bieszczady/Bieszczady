interface ProgressBarProps {
  percent: number;
  ariaLabel?: string;
  className?: string;
}

export default function ProgressBar({
  percent,
  ariaLabel,
  className = '',
}: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
    >
      <div
        className="h-full rounded-full bg-darkGreen transition-[width] duration-300"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
