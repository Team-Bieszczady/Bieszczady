import type { DuplicateParticipant } from '../../../lib/api';

interface DuplicateParticipantWarningProps {
  matches: DuplicateParticipant[];
}

function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

export function DuplicateParticipantWarning({
  matches,
}: DuplicateParticipantWarningProps) {
  if (matches.length === 0) {
    return null;
  }

  const title =
    matches.length === 1
      ? 'Taka osoba jest już w bazie:'
      : 'Takie osoby są już w bazie:';

  return (
    <div
      role="alert"
      className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
    >
      <p className="font-medium">{title}</p>
      <ul className="mt-1 space-y-0.5">
        {matches.map((match) => (
          <li key={match.id}>
            {fullName(match)}
            {match.email && ` · ${match.email}`}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-amber-700">
        Jeśli to inna osoba, możesz spokojnie zapisać.
      </p>
    </div>
  );
}
