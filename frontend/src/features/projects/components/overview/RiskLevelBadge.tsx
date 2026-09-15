import type { RiskLevelValue } from '../../../../lib/projectsApi';

interface RiskLevelBadgeProps {
  level: RiskLevelValue;
  label: string;
}

const TONE: Record<RiskLevelValue, string> = {
  HIGH: 'bg-redSoft text-darkRed',
  MEDIUM: 'bg-amberSoft text-amberDark',
  LOW: 'bg-gray-200 text-grayText',
};

export default function RiskLevelBadge({ level, label }: RiskLevelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-[0.3px] whitespace-nowrap ${TONE[level]}`}
    >
      {label}
    </span>
  );
}
