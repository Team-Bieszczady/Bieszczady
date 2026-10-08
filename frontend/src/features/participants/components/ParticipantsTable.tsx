import { Avatar } from '../../../components/ui/Avatar';
import { Spinner } from '../../../components/ui/Spinner';
import type { BackendParticipant } from '../../../lib/api';
import { MEETING_FORMS, pluralizePl } from '../../../lib/pluralizePl';
import { ConsentBadge } from './ConsentBadge';

interface ParticipantsTableProps {
  participants: BackendParticipant[];
  isLoading: boolean;
  emptyMessage: string;
}

const HEADER_CLASSES =
  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600';

function initialsOf(participant: BackendParticipant) {
  return `${participant.firstName[0]}${participant.lastName[0]}`.toUpperCase();
}

function ContactValue({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-gray-400">brak</span>;
  }

  return <span>{value}</span>;
}

function EmptyState({
  isLoading,
  message,
}: {
  isLoading: boolean;
  message: string;
}) {
  if (isLoading) {
    return (
      <span role="status" aria-live="polite" className="flex justify-center">
        <Spinner variant="dark" size="24" />
      </span>
    );
  }

  return <span>{message}</span>;
}

export default function ParticipantsTable({
  participants,
  isLoading,
  emptyMessage,
}: ParticipantsTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className={HEADER_CLASSES}>Osoba</th>
              <th className={HEADER_CLASSES}>Telefon</th>
              <th className={HEADER_CLASSES}>Zgoda na kontakt</th>
              <th className={HEADER_CLASSES}>Spotkania</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => (
              <tr
                key={participant.id}
                className="border-b border-gray-200 last:border-b-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={initialsOf(participant)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-dark">
                        {participant.firstName} {participant.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        <ContactValue value={participant.email} />
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-800">
                  <ContactValue value={participant.phone} />
                </td>
                <td className="px-4 py-3">
                  <ConsentBadge consentAt={participant.consentAt} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-800">
                  {pluralizePl(participant.meetingCount, MEETING_FORMS)}
                </td>
              </tr>
            ))}
            {participants.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  <EmptyState isLoading={isLoading} message={emptyMessage} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 sm:hidden">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="animate-fade-in rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={initialsOf(participant)} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-dark">
                  {participant.firstName} {participant.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  <ContactValue value={participant.email} />
                </p>
              </div>
            </div>

            <div className="my-3 border-t border-gray-200" />

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500">Telefon</p>
                <p className="text-dark">
                  <ContactValue value={participant.phone} />
                </p>
              </div>
              <div>
                <p className="text-gray-500">Spotkania</p>
                <p className="text-dark">
                  {pluralizePl(participant.meetingCount, MEETING_FORMS)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="mb-1 text-gray-500">Zgoda na kontakt</p>
                <ConsentBadge consentAt={participant.consentAt} />
              </div>
            </div>
          </div>
        ))}
        {participants.length === 0 && (
          <div className="flex min-h-30 items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            <EmptyState isLoading={isLoading} message={emptyMessage} />
          </div>
        )}
      </div>
    </>
  );
}
