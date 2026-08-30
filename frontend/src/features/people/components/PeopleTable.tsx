import type { Person } from '../data';
import PeopleTableRow from './PeopleTableRow';
import PeopleCard from './PeopleCard';
import { Spinner } from '../../../components/ui/Spinner';

interface PeopleTableProps {
  people: Person[];
  onAddUser?: () => void;
  canAddUser?: boolean;
  emptyMessage?: string;
  isLoading?: boolean;
}

export default function PeopleTable({
  people,
  onAddUser,
  canAddUser = false,
  emptyMessage,
  isLoading = false,
}: PeopleTableProps) {
  const isFilteredEmpty = !!emptyMessage;
  const emptyText = emptyMessage ?? 'Dodaj użytkownika';
  const emptyClickable = canAddUser && !isFilteredEmpty && !isLoading;

  return (
    <>
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 bg-white table-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                OSOBA
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                ROLA
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                PROJEKT
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                ZADANIA
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                STATUS
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                AKCJE
              </th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <PeopleTableRow key={person.id} person={person} />
            ))}
            {people.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className={`px-4 py-10 text-center text-gray-400 text-sm ${
                    emptyClickable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
                  }`}
                  onClick={emptyClickable ? onAddUser : undefined}
                >
                  {isLoading ? (
                    <span
                      role="status"
                      aria-live="polite"
                      className="flex justify-center"
                    >
                      <Spinner variant="dark" size="24" />
                    </span>
                  ) : (
                    emptyText
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-3">
        {people.map((person) => (
          <div key={person.id} className="animate-fade-in">
            <PeopleCard person={person} />
          </div>
        ))}
        {people.length === 0 && (
          <div
            className={`border border-gray-200 rounded-lg bg-white p-6 text-center text-gray-400 text-sm ${
              emptyClickable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
            }`}
            style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={emptyClickable ? onAddUser : undefined}
          >
            {isLoading ? (
              <span role="status" aria-live="polite">
                <Spinner variant="dark" size="24" />
              </span>
            ) : (
              emptyText
            )}
          </div>
        )}
      </div>
    </>
  );
}
