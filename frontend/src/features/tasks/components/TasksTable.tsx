import type { KeyboardEvent } from 'react';
import { TASK_PRIORITY_LABELS } from '../../projects/labels';
import type { TaskRow } from '../data';
import TaskDeadlineCell from './TaskDeadlineCell';
import TaskStatusBadge from './TaskStatusBadge';

interface TasksTableProps {
  rows: TaskRow[];
  today: string;
  canEdit: boolean;
  emptyMessage?: string;
  onAdd: () => void;
  onOpen: (row: TaskRow) => void;
}

const HEADERS = [
  'ZADANIE',
  'KATEGORIA',
  'OSOBA',
  'TERMIN',
  'PRIORYTET',
  'STATUS',
];

const TH_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600';

function StageChip({
  name,
  className = '',
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      title={name}
      className={`inline-block max-w-full truncate rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 ${className}`}
    >
      {name}
    </span>
  );
}

function EmptyPrompt({
  message,
  canAdd,
  onAdd,
}: {
  message?: string;
  canAdd: boolean;
  onAdd: () => void;
}) {
  if (message || !canAdd) {
    return (
      <p className="px-4 py-10 text-center text-sm text-gray-400">
        {message ?? 'Brak zadań w tym projekcie'}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-full cursor-pointer px-4 py-10 text-center text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-dark focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
    >
      Dodaj zadanie
    </button>
  );
}

export default function TasksTable({
  rows,
  today,
  canEdit,
  emptyMessage,
  onAdd,
  onOpen,
}: TasksTableProps) {
  const isEmpty = rows.length === 0;

  const onCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    row: TaskRow,
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpen(row);
  };

  return (
    <>
      <div className="table-scrollbar hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              {HEADERS.map((header) => (
                <th key={header} className={TH_CLASSES}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={HEADERS.length}>
                  <EmptyPrompt
                    message={emptyMessage}
                    canAdd={canEdit}
                    onAdd={onAdd}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onOpen(row)}
                  className="cursor-pointer border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <p
                      title={row.title}
                      className="max-w-48 truncate text-xs font-medium text-dark"
                    >
                      {row.title}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StageChip name={row.stageName} />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-800">
                    {row.owner ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <TaskDeadlineCell row={row} today={today} />
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-800">
                    {TASK_PRIORITY_LABELS[row.priority]}
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={row.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {isEmpty ? (
          <div className="rounded-lg border border-gray-200 bg-white">
            <EmptyPrompt
              message={emptyMessage}
              canAdd={canEdit}
              onAdd={onAdd}
            />
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row.id}
              role="button"
              tabIndex={0}
              aria-label={`Otwórz zadanie ${row.title}`}
              onClick={() => onOpen(row)}
              onKeyDown={(event) => onCardKeyDown(event, row)}
              className="animate-fade-in cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 focus-visible:ring-1 focus-visible:ring-darkGreen focus-visible:outline-none"
            >
              <div className="mb-3">
                <p className="text-sm font-medium text-dark">{row.title}</p>
                <StageChip name={row.stageName} className="mt-1" />
              </div>

              <div className="mb-3 border-t border-gray-200" />

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2">
                  <div>
                    <p className="text-gray-500">Osoba</p>
                    <p className="font-medium text-dark">{row.owner ?? '—'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Status</p>
                    <TaskStatusBadge status={row.status} className="mt-0.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div>
                    <p className="text-gray-500">Termin</p>
                    <TaskDeadlineCell row={row} today={today} />
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Priorytet</p>
                    <p className="text-dark">
                      {TASK_PRIORITY_LABELS[row.priority]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
