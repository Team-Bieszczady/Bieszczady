import { formatMoney, type Spend } from '../utils/budgetTotals';

interface SpendCellsProps {
  spend: Spend;
  isEmpty?: boolean;
}

export function SpendCells({ spend, isEmpty = false }: SpendCellsProps) {
  const { remaining, usage, isOver } = spend;

  return (
    <>
      <td
        className={`px-4 py-3 text-right whitespace-nowrap tabular-nums ${
          isOver ? 'text-darkRed' : ''
        }`}
      >
        {isEmpty ? '—' : formatMoney(remaining)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        {isEmpty || usage === null ? (
          <span className="text-gray-400">—</span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full ${isOver ? 'bg-darkRed' : 'bg-darkGreen'}`}
                style={{ width: `${Math.min(usage, 1) * 100}%` }}
              />
            </div>
            <span
              className={`w-10 text-xs tabular-nums ${
                isOver ? 'font-bold text-darkRed' : 'text-gray-600'
              }`}
            >
              {Math.round(usage * 100)}%
            </span>
          </div>
        )}
      </td>
    </>
  );
}
