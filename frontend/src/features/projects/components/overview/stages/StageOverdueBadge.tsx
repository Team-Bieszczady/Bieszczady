interface StageOverdueBadgeProps {
  size?: 'default' | 'micro';
  className?: string;
}

const SIZE = {
  default: 'px-2 py-0.5 text-[10px] tracking-[0.3px]',
  micro: 'px-1.5 py-0 text-[9px]',
} as const;

export default function StageOverdueBadge({
  size = 'default',
  className = '',
}: StageOverdueBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-redSoft font-semibold whitespace-nowrap text-darkRed ${SIZE[size]} ${className}`}
    >
      Po terminie
    </span>
  );
}
