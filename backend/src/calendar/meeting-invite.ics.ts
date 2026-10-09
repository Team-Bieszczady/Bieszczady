function escapeIcsText(text: string) {
  return text
    .split('\\')
    .join('\\\\')
    .split('\n')
    .join('\\n')
    .split(',')
    .join('\\,')
    .split(';')
    .join('\\;');
}

function toIcsUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export interface MeetingIcsInput {
  meetingId: string;
  title: string;
  note: string;
  place: string | null;
  meetingUrl: string | null;
  startsAt: Date;
  endsAt: Date;
  organizerEmail: string;
  attendeeEmail: string;
  attendeeName: string;
  sequence: number;
  isCancelled: boolean;
}

export function buildMeetingIcs(input: MeetingIcsInput) {
  const descriptionParts = [];
  if (input.note) {
    descriptionParts.push(input.note);
  }
  if (input.meetingUrl) {
    descriptionParts.push(`Link do spotkania: ${input.meetingUrl}`);
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Bieszczadzki Uniwersytet Ludowy//Wirtualne Biuro//PL',
    'VERSION:2.0',
    `METHOD:${input.isCancelled ? 'CANCEL' : 'REQUEST'}`,
    'BEGIN:VEVENT',
    `UID:meeting-${input.meetingId}@bieszczadzki-ul`,
    `SEQUENCE:${input.sequence}`,
    `DTSTAMP:${toIcsUtc(new Date())}`,
    `DTSTART:${toIcsUtc(input.startsAt)}`,
    `DTEND:${toIcsUtc(input.endsAt)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
    `STATUS:${input.isCancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    `ORGANIZER;CN=Bieszczadzki Uniwersytet Ludowy:mailto:${input.organizerEmail}`,
    `ATTENDEE;CN=${escapeIcsText(input.attendeeName)};RSVP=FALSE:mailto:${input.attendeeEmail}`,
  ];

  if (input.place) {
    lines.push(`LOCATION:${escapeIcsText(input.place)}`);
  }
  if (descriptionParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}
