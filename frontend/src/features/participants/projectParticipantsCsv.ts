import type { ProjectParticipant } from '../../lib/api';
import { buildCsv } from './csv';

const HEADER = 'Imię;Nazwisko;Telefon;E-mail;Adres;Liczba spotkań';

export function toProjectParticipantsCsv(participants: ProjectParticipant[]) {
  const rows = participants.map((participant) => [
    participant.firstName,
    participant.lastName,
    participant.phone ?? '',
    participant.email ?? '',
    participant.address ?? '',
    String(participant.meetingCount),
  ]);

  return buildCsv(HEADER, rows);
}
