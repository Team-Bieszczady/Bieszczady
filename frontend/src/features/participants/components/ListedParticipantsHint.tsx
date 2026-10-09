import { PERSON_FORMS, pluralizePl } from '../../../lib/pluralizePl';
import { useMeetingParticipants } from '../hooks/useMeetingParticipants';

interface ListedParticipantsHintProps {
  meetingId: string;
  typedCount: string;
  onUseCount: (count: number) => void;
}

export function ListedParticipantsHint({
  meetingId,
  typedCount,
  onUseCount,
}: ListedParticipantsHintProps) {
  const participantsQuery = useMeetingParticipants(meetingId);

  if (!participantsQuery.data || participantsQuery.data.length === 0) {
    return null;
  }

  const listed = participantsQuery.data.length;
  const isDifferent = typedCount.trim() !== String(listed);

  return (
    <p className="text-xs text-grayText">
      Dopisano z bazy: {pluralizePl(listed, PERSON_FORMS)}
      {isDifferent && (
        <>
          {' · '}
          <button
            type="button"
            onClick={() => onUseCount(listed)}
            className="cursor-pointer font-medium text-darkGreen hover:text-darkGreenHover hover:underline"
          >
            Wpisz {listed}
          </button>
        </>
      )}
    </p>
  );
}
