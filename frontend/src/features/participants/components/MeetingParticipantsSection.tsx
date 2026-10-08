import { useState } from 'react';
import toast from 'react-hot-toast';
import { LuSearch, LuUserPlus, LuX } from 'react-icons/lu';
import type {
  BackendParticipant,
  MeetingParticipant,
  ParticipantChanges,
} from '../../../lib/api';
import { PERSON_FORMS, pluralizePl } from '../../../lib/pluralizePl';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useAddMeetingParticipant } from '../hooks/useAddMeetingParticipant';
import { useCreateParticipant } from '../hooks/useCreateParticipant';
import { useMeetingParticipants } from '../hooks/useMeetingParticipants';
import { useParticipants } from '../hooks/useParticipants';
import { useRemoveMeetingParticipant } from '../hooks/useRemoveMeetingParticipant';
import { QuickAddParticipant } from './QuickAddParticipant';

interface MeetingParticipantsSectionProps {
  meetingId: string;
}

const MAX_MATCHES = 5;
const SEARCH_DELAY_MS = 300;

function fullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`;
}

export function MeetingParticipantsSection({
  meetingId,
}: MeetingParticipantsSectionProps) {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const searchedText = useDebouncedValue(search.trim(), SEARCH_DELAY_MS);

  const isSearching = searchedText !== '';
  const attendeesQuery = useMeetingParticipants(meetingId);
  const matchesQuery = useParticipants(searchedText, { enabled: isSearching });
  const addParticipant = useAddMeetingParticipant(meetingId);
  const removeParticipant = useRemoveMeetingParticipant(meetingId);
  const createParticipant = useCreateParticipant();

  const attendees = attendeesQuery.data || [];
  const attendeeIds = attendees.map((attendee) => attendee.id);

  let matches: BackendParticipant[] = [];
  if (isSearching) {
    matches = (matchesQuery.data || [])
      .filter((participant) => !attendeeIds.includes(participant.id))
      .slice(0, MAX_MATCHES);
  }

  const addToMeeting = (participantId: string, name: string) => {
    addParticipant.mutate(participantId, {
      onSuccess: () => {
        setSearch('');
        setIsAddingNew(false);
        toast.success(`Dopisano: ${name}`);
      },
      onError: (error) => toast.error(error.message),
    });
  };

  const removeFromMeeting = (attendee: MeetingParticipant) => {
    removeParticipant.mutate(attendee.id, {
      onSuccess: () =>
        toast.success(`Usunięto ze spotkania: ${fullName(attendee)}`),
      onError: (error) => toast.error(error.message),
    });
  };

  const createAndAdd = (participant: ParticipantChanges) => {
    createParticipant.mutate(participant, {
      onSuccess: (created) => addToMeeting(created.id, fullName(participant)),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <section className="space-y-3" aria-label="Uczestnicy spotkania">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-dark/80">Uczestnicy spotkania</p>
        <span className="text-xs text-grayText">
          {pluralizePl(attendees.length, PERSON_FORMS)}
        </span>
      </div>

      {attendees.length === 0 && (
        <p className="text-xs text-grayText">
          Nikogo jeszcze nie dopisano. Wyszukaj osoby z listy obecności.
        </p>
      )}

      {attendees.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attendees.map((attendee) => (
            <li
              key={attendee.id}
              className="inline-flex items-center gap-1 rounded-full border border-gray-300 py-1 pr-1 pl-3 text-xs font-medium text-dark"
            >
              {fullName(attendee)}
              <button
                type="button"
                onClick={() => removeFromMeeting(attendee)}
                disabled={removeParticipant.isPending}
                aria-label={`Usuń ze spotkania: ${fullName(attendee)}`}
                className="cursor-pointer rounded-full p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-darkRed disabled:cursor-not-allowed disabled:opacity-40"
              >
                <LuX size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <LuSearch
          size={14}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Dopisz osobę z bazy uczestników..."
          aria-label="Wyszukaj osobę do dopisania"
          className="h-8 w-full rounded-lg border border-gray-300 pr-3 pl-8 text-xs text-dark focus:border-transparent focus:ring-1 focus:ring-darkGreen focus:outline-none"
        />
      </div>

      {isSearching && !isAddingNew && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200">
          {matches.map((match) => (
            <li key={match.id}>
              <button
                type="button"
                onClick={() => addToMeeting(match.id, fullName(match))}
                disabled={addParticipant.isPending}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-gray-50"
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-dark">
                    {fullName(match)}
                  </span>
                  {match.email && (
                    <span className="ml-2 text-grayText">{match.email}</span>
                  )}
                </span>
                <span className="shrink-0 font-medium text-darkGreen">
                  + Dopisz
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-medium text-darkGreen transition-colors hover:bg-gray-50"
            >
              <LuUserPlus size={14} aria-hidden="true" />
              Dodaj nową osobę „{searchedText}”
            </button>
          </li>
        </ul>
      )}

      {isAddingNew && (
        <QuickAddParticipant
          searchedName={searchedText}
          isPending={createParticipant.isPending || addParticipant.isPending}
          onCancel={() => setIsAddingNew(false)}
          onSubmit={createAndAdd}
        />
      )}
    </section>
  );
}
