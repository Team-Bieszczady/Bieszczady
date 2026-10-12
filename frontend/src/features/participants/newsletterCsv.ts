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
  const usedEmails = new Set<string>();

  for (const participant of participants) {
    const email = participant.email;

    if (participant.consentAt === null) {
      continue;
    }

    if (email === null || email.trim() === '') {
      continue;
    }

    // Rodzina może mieć jeden wspólny adres; newsletter ma przyjść raz.
    if (usedEmails.has(email.toLowerCase())) {
      continue;
    }
    usedEmails.add(email.toLowerCase());

    recipients.push({
      firstName: participant.firstName,
      lastName: participant.lastName,
      email,
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

export function countWithConsentButNoEmail(participants: BackendParticipant[]) {
  let count = 0;

  for (const participant of participants) {
    const email = participant.email;
    const hasEmail = email !== null && email.trim() !== '';

    if (participant.consentAt !== null && !hasEmail) {
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
