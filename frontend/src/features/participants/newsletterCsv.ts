import type { BackendParticipant } from '../../lib/api';
import { buildCsv } from './csv';

const HEADER = 'Imię;Nazwisko;E-mail';

export interface NewsletterRecipient {
  firstName: string;
  lastName: string;
  email: string;
}

export function newsletterRecipients(participants: BackendParticipant[]) {
  const recipients: NewsletterRecipient[] = [];

  for (const participant of participants) {
    if (participant.consentAt === null) {
      continue;
    }

    if (participant.email === null || participant.email.trim() === '') {
      continue;
    }

    recipients.push({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
    });
  }

  return recipients;
}

export function countWithConsent(participants: BackendParticipant[]) {
  let count = 0;

  for (const participant of participants) {
    if (participant.consentAt !== null) {
      count += 1;
    }
  }

  return count;
}

export function toNewsletterCsv(recipients: NewsletterRecipient[]) {
  const rows = recipients.map((recipient) => [
    recipient.firstName,
    recipient.lastName,
    recipient.email,
  ]);

  return buildCsv(HEADER, rows);
}
