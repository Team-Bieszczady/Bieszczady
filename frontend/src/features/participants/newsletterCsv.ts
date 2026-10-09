import type { BackendParticipant } from '../../lib/api';

const SEPARATOR = ';';
const HEADER = 'Imię;Nazwisko;E-mail';
const POLISH_LETTERS_MARK = '﻿';

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

function csvValue(value: string) {
  const needsQuotes =
    value.includes(SEPARATOR) || value.includes('"') || value.includes('\n');

  if (!needsQuotes) {
    return value;
  }

  return `"${value.split('"').join('""')}"`;
}

export function toNewsletterCsv(recipients: NewsletterRecipient[]) {
  const lines = [HEADER];

  for (const recipient of recipients) {
    const values = [recipient.firstName, recipient.lastName, recipient.email];
    lines.push(values.map(csvValue).join(SEPARATOR));
  }

  return POLISH_LETTERS_MARK + lines.join('\r\n');
}
