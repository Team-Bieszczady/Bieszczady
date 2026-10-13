import type { Partner } from '../data';
import PartnersTableRow from './PartnersTableRow';
import PartnerCard from './PartnerCard';
import { Spinner } from '../../../components/ui/Spinner';

interface PartnersTableProps {
  partners: Partner[];
  onOpen: (partner: Partner) => void;
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
  onAdd?: () => void;
  emptyMessage?: string;
  isLoading?: boolean;
}

const COLUMNS = [
  'ORGANIZACJA',
  'OSOBA KONTAKTOWA',
  'PROJEKTY',
  'UMOWA',
  'STATUS',
  'AKCJE',
];

export default function PartnersTable({
  partners,
  onOpen,
  onEdit,
  onDelete,
  onAdd,
  emptyMessage,
  isLoading = false,
}: PartnersTableProps) {
  const isFilteredEmpty = !!emptyMessage;
  const emptyText = emptyMessage ?? 'Dodaj partnera';
  const emptyClickable = !!onAdd && !isFilteredEmpty && !isLoading;

  return (
    <>
      <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200 bg-white table-scrollbar">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <PartnersTableRow
                key={partner.id}
                partner={partner}
                onOpen={onOpen}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {partners.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className={`px-4 py-10 text-center text-gray-400 text-sm ${
                    emptyClickable
                      ? 'cursor-pointer hover:bg-gray-50 transition-colors'
                      : ''
                  }`}
                  onClick={emptyClickable ? onAdd : undefined}
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
        {partners.map((partner) => (
          <div key={partner.id} className="animate-fade-in">
            <PartnerCard
              partner={partner}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
        {partners.length === 0 && (
          <div
            className={`flex min-h-30 items-center justify-center border border-gray-200 rounded-lg bg-white p-6 text-center text-gray-400 text-sm ${
              emptyClickable
                ? 'cursor-pointer hover:bg-gray-50 transition-colors'
                : ''
            }`}
            onClick={emptyClickable ? onAdd : undefined}
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
