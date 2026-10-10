import { formatMoney, type Spend } from '../utils/budgetTotals';

interface SpendCellProps {
  spend: Spend;
  isEmpty?: boolean;
}

export function RemainingCell({ spend, isEmpty = false }: SpendCellProps) {
  return (
    <td
      className={`px-3 py-3 whitespace-nowrap tabular-nums ${
        spend.isOver ? 'text-darkRed' : ''
      }`}
    >
      {isEmpty ? '—' : formatMoney(spend.remaining)}
    </td>
  );
}

export function UsageCell({
  spend,
  isEmpty = false,
  showBar = true,
}: SpendCellProps & { showBar?: boolean }) {
  const { usage, isOver } = spend;
  const barColor = isOver
    ? 'bg-darkRed'
    : usage !== null && usage >= 1
      ? 'bg-darkGreen'
      : usage === 0
        ? 'bg-amberDark'
        : 'bg-blue-500';

  return (
    <td className="px-3 py-3 whitespace-nowrap">
      {isEmpty || usage === null ? (
        <span className="text-gray-400">—</span>
      ) : (
        <div className="flex items-center gap-2">
          {showBar && (
            <div
              className={`h-1.5 w-24 overflow-hidden rounded-full ${
                usage === 0 ? 'bg-amberSoft' : 'bg-gray-200'
              }`}
            >
              <div
                className={`h-full rounded-full ${barColor}`}
                style={{ width: `${Math.min(usage, 1) * 100}%` }}
              />
            </div>
          )}
          <span
            className={`text-xs tabular-nums ${
              isOver ? 'font-bold text-darkRed' : 'text-gray-600'
            }`}
          >
            {Math.round(usage * 100)}%
          </span>
        </div>
      )}
    </td>
  );
}
