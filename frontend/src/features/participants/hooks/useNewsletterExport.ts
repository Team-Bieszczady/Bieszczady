import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthToken } from '../../../context/useAuthToken';
import { api } from '../../../lib/api';
import { todayIso } from '../../projects/utils/isoDate';
import {
  PERSON_FORMS,
  pluralizePl,
  type PluralForms,
} from '../../../lib/pluralizePl';
import { downloadCsv } from '../csv';
import {
  countWithConsent,
  newsletterRecipients,
  toNewsletterCsv,
} from '../newsletterCsv';

const EXPORT_TOAST_ID = 'newsletter-export';

const WITHOUT_EMAIL_FORMS: PluralForms = [
  'osoba ze zgodą nie ma e-maila',
  'osoby ze zgodą nie mają e-maila',
  'osób ze zgodą nie ma e-maila',
];

function savedMessage(savedCount: number, withoutEmailCount: number) {
  const saved = `Pobrano listę: ${pluralizePl(savedCount, PERSON_FORMS)}`;

  if (withoutEmailCount === 0) {
    return saved;
  }

  return `${saved}. ${pluralizePl(withoutEmailCount, WITHOUT_EMAIL_FORMS)}`;
}

export function useNewsletterExport() {
  const { requireToken } = useAuthToken();
  const [isExporting, setIsExporting] = useState(false);

  const exportNewsletter = async () => {
    setIsExporting(true);

    try {
      const participants = await api.getParticipants(requireToken(), '');
      const recipients = newsletterRecipients(participants);
      const consentCount = countWithConsent(participants);
      const withoutEmailCount = consentCount - recipients.length;

      if (recipients.length === 0) {
        if (consentCount === 0) {
          toast.error('Nikt jeszcze nie zgodził się na kontakt', {
            id: EXPORT_TOAST_ID,
          });
        } else {
          toast.error('Osoby ze zgodą na kontakt nie mają jeszcze e-maila', {
            id: EXPORT_TOAST_ID,
          });
        }
        return;
      }

      downloadCsv(toNewsletterCsv(recipients), `newsletter-${todayIso()}.csv`);
      toast.success(savedMessage(recipients.length, withoutEmailCount), {
        id: EXPORT_TOAST_ID,
      });
    } catch (error) {
      toast.error((error as Error).message, { id: EXPORT_TOAST_ID });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportNewsletter, isExporting };
}
